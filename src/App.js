import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

// Import configuration and socket utilities
import config from './config';
import { initSocket, joinProjectRoom, leaveProjectRoom, disconnectSocket } from './socket';


// Base URL for your backend API from config
const API_BASE_URL = config.apiUrl; // Use configuration based on environment

// Helper function to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function to get current user details from localStorage
const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
        return null;
    }
};

// New UserAvatar Component
const UserAvatar = ({ user, size = 'medium' }) => {
  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(user.name);

  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-sm',
    large: 'w-10 h-10 text-base',
  };

  const bgColor = user._id ? `bg-gradient-to-br from-indigo-400 to-purple-500` : 'bg-gray-400'; // Simple hash-based color if needed, or static for now

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-bold flex-shrink-0
        ${sizeClasses[size]} ${bgColor}`}
      title={user.name}
    >
      {initials}
    </div>
  );
};


// Define a simple header component
const Header = ({ title, onAddProject, onLogout }) => {
  return (
    <header className="bg-white p-4 shadow-md rounded-lg flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
          >
            New Project
          </button>
        )}
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

// Define a simple sidebar component for navigation
const Sidebar = ({ onNavigate, currentUser }) => { // Added currentUser prop
  const [activeItem, setActiveItem] = useState('projects');

  const navItems = [
    { id: 'projects', name: 'Projects', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7m-4 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m5 0h.01M12 12h.01M12 16h.01" />
        </svg>
      )
    },
    { id: 'dashboard', name: 'Dashboard', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { id: 'my-tickets', name: 'My Tickets', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { id: 'profile', name: 'Profile', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    // More items can be added here
  ];

  // Add "Admin Panel" if user is an admin
  if (currentUser?.role === 'admin') {
      navItems.push({
          id: 'admin-panel',
          name: 'Admin Panel',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
      });
  }

  const handleItemClick = (id) => {
    setActiveItem(id);
    onNavigate(id);
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0 h-screen p-4 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-indigo-400">BugTracker</h2>
      </div>
      <div className="mb-6 px-3 py-2 bg-gray-700 rounded-md text-sm text-gray-300">
          <p className="font-semibold mb-2">Logged in as:</p>
          <div className="flex items-center space-x-2">
            {currentUser && <UserAvatar user={currentUser} size="medium" />}
            <div>
                <p className="break-words font-medium text-gray-100">{currentUser?.name}</p>
                <p className="break-words text-xs">{currentUser?.email}</p>
                <p className="break-words text-xs font-semibold text-indigo-300 capitalize">{currentUser?.role}</p> {/* Display role */}
            </div>
          </div>
      </div>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center w-full p-3 rounded-lg text-lg transition duration-300 ease-in-out
                  ${activeItem === item.id ? 'bg-indigo-700 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
                }
              >
                {item.icon}
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

// Modal component for forms
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// Component for user registration/login
const RegisterForm = ({ onRegisterSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const endpoint = isLoginView ? `${API_BASE_URL}/users/login` : `${API_BASE_URL}/users/register`;
        const payload = isLoginView ? { email, password } : { name, email, password };

        try {
            const response = await axios.post(endpoint, payload);
            localStorage.setItem('token', response.data.token);
            // Ensure the 'role' is stored when user logs in/registers
            localStorage.setItem('user', JSON.stringify({ _id: response.data._id, name: response.data.name, email: response.data.email, role: response.data.role }));
            setMessage(`${isLoginView ? 'Login' : 'Registration'} successful! Redirecting...`);
            onRegisterSuccess();
        } catch (error) {
            setMessage(error.response?.data?.message || `${isLoginView ? 'Login' : 'Registration'} failed`);
            console.error(`${isLoginView ? 'Login' : 'Registration'} error:`, error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{isLoginView ? 'Login' : 'Register'}</h2>
                {message && <p className={`mb-4 text-center ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                {!isLoginView && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Name
                        </label>
                        <input
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
                            id="name"
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLoginView}
                        />
                    </div>
                )}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
                        id="email"
                        type="email"
                        placeholder="Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
                        id="password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out w-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (isLoginView ? 'Logging In...' : 'Registering...') : (isLoginView ? 'Login' : 'Register')}
                    </button>
                </div>
                <p className="text-center text-gray-600 text-sm mt-4">
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="text-indigo-600 hover:text-indigo-800 font-bold">
                        {isLoginView ? 'Register' : 'Login'}
                    </button>
                </p>
            </form>
        </div>
    );
};


// Component to create a new project
const CreateProjectForm = ({ onProjectCreated, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                setMessage('Not authenticated. Please log in.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const newProject = { title, description };
            const response = await axios.post(`${API_BASE_URL}/projects`, newProject, config);
            setMessage('Project created successfully!');
            onProjectCreated(response.data);
            onClose();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to create project');
            console.error('Project creation error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Project</h2>
            {message && <p className={`mb-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="projectTitle">Title</label>
                <input
                    type="text"
                    id="projectTitle"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="projectDescription">Description</label>
                <textarea
                    id="projectDescription"
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>
            </div>

            <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Project'}
            </button>
        </form>
    );
};


// Component to display a list of projects
const ProjectDashboard = ({ onSelectProject, onProjectCreated, projects, loading, error, onAddProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredProjects = useMemo(() => {
    let currentProjects = projects;

    // Apply search term
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentProjects = currentProjects.filter(project =>
        project.title.toLowerCase().includes(lowercasedSearchTerm) ||
        project.description?.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // Apply status filter
    if (filterStatus) {
      currentProjects = currentProjects.filter(project => project.status === filterStatus);
    }

    return currentProjects;
  }, [projects, searchTerm, filterStatus]);


  if (loading) return <div className="text-center text-gray-500">Loading projects...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <Header title="Projects" onAddProject={onAddProject} />

      {/* Search and Filter Controls for Projects */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectSearchTerm" className="block text-sm font-medium text-gray-700">Search Projects</label>
          <input
            type="text"
            id="projectSearchTerm"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="projectFilterStatus" className="block text-sm font-medium text-gray-700">Filter by Status</label>
          <select
            id="projectFilterStatus"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>


      {filteredProjects.length === 0 ? (
        <p className="text-center text-gray-500 italic mt-8">No projects found matching your criteria. Click "New Project" to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map(project => (
            <div key={project._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{project.description || 'No description provided.'}</p>
              </div>
              <div className="mt-4">
                {/* Dummy progress for now, will be calculated based on tickets later */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(project.status === 'completed' ? 100 : 50, 100)}%` }} // Placeholder progress
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">{project.status === 'completed' ? '100% Complete' : 'In Progress'}</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => onSelectProject(project._id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium py-1 px-3 rounded-md bg-indigo-50 hover:bg-indigo-100 transition duration-200 ease-in-out"
                  >
                    Open Project
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-sm font-medium py-1 px-3 rounded-md bg-gray-100 hover:bg-gray-200 transition duration-200 ease-in-out">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Ticket Form component (for creation)
const TicketForm = ({ projectId, onTicketCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');
  const [type, setType] = useState('Bug');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, config);
        const members = [response.data.owner, ...response.data.teamMembers]
            .filter((member, index, self) =>
                member && self.findIndex(m => m._id === member._id) === index
            );
        setProjectMembers(members);
      } catch (err) {
        console.error('Error fetching project members:', err);
        setMessage('Failed to load project members.');
      }
    };
    if (projectId) {
        fetchProjectMembers();
    }
  }, [projectId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = getToken();
      if (!token) {
        setMessage('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const newTicket = {
        project: projectId,
        title,
        description,
        status,
        priority,
        assignee: assignee || null,
        type,
        dueDate: dueDate || null,
      };

      const response = await axios.post(`${API_BASE_URL}/tickets`, newTicket, config);
      setMessage('Ticket created successfully!');
      onTicketCreated(response.data);
      onClose();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create ticket');
      console.error('Ticket creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Ticket</h2>
      {message && <p className={`mb-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="description">Description</label>
        <textarea
          id="description"
          rows="3"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="status">Status</label>
        <select
          id="status"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
          <option>Blocked</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="priority">Priority</label>
        <select
          id="priority"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="assignee">Assignee</label>
        <select
          id="assignee"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Unassigned</option>
          {projectMembers.map(member => (
            <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="type">Type</label>
        <select
          id="type"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>Bug</option>
          <option>Feature</option>
          <option>Task</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="dueDate">Due Date</label>
        <input
          type="date"
          id="dueDate"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
};


// Edit Ticket Form component
const EditTicketForm = ({ ticket, projectMembers, onTicketUpdated, onClose }) => {
    const [title, setTitle] = useState(ticket.title);
    const [description, setDescription] = useState(ticket.description || '');
    const [status, setStatus] = useState(ticket.status);
    const [priority, setPriority] = useState(ticket.priority);
    const [assignee, setAssignee] = useState(ticket.assignee?._id || '');
    const [type, setType] = useState(ticket.type);
    const [dueDate, setDueDate] = useState(ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                setMessage('Not authenticated. Please log in.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const updatedTicket = {
                title,
                description,
                status,
                priority,
                assignee: assignee || null,
                type,
                dueDate: dueDate || null,
            };

            const response = await axios.put(`${API_BASE_URL}/tickets/${ticket._id}`, updatedTicket, config);
            setMessage('Ticket updated successfully!');
            onTicketUpdated(response.data);
            onClose();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update ticket');
            console.error('Ticket update error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Ticket: {ticket.title}</h2>
            {message && <p className={`mb-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editTitle">Title</label>
                <input
                    type="text"
                    id="editTitle"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editDescription">Description</label>
                <textarea
                    id="editDescription"
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editStatus">Status</label>
                <select
                    id="editStatus"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                    <option>Blocked</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editPriority">Priority</label>
                <select
                    id="editPriority"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editAssignee">Assignee</label>
                <select
                    id="editAssignee"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                >
                    <option value="">Unassigned</option>
                    {projectMembers.map(member => (
                        <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editType">Type</label>
                <select
                    id="editType"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option>Bug</option>
                    <option>Feature</option>
                    <option>Task</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editDueDate">Due Date</label>
                <input
                    type="date"
                    id="editDueDate"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md"
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};


// Confirmation Modal for Delete operations
const ConfirmationModal = ({ isOpen, onClose, onConfirm, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto w-full max-w-lg">
                <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                &times;
                </button>
                <div className="text-center p-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Action</h3>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={onConfirm}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// New CommentsSection Component
const CommentsSection = ({ ticketId }) => {
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const currentUser = getCurrentUser(); // Get current user for displaying their name

    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            if (!token) {
                setError('User not authenticated. Please log in.');
                setLoading(false);
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Assuming a backend endpoint for comments: /api/comments/ticket/:ticketId
            const response = await axios.get(`${API_BASE_URL}/comments/ticket/${ticketId}`, config);
            setComments(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch comments.');
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            const token = getToken();
            if (!token) {
                setError('Not authenticated. Please log in.');
                setSubmitting(false);
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE_URL}/comments`, {
                ticket: ticketId,
                text: newCommentText,
            }, config);
            setComments(prevComments => [...prevComments, response.data]);
            setNewCommentText('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add comment.');
            console.error('Error adding comment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center text-gray-500 text-sm">Loading comments...</div>;
    if (error) return <div className="text-center text-red-600 text-sm">{error}</div>;

    return (
        <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Comments ({comments.length})</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2"> {/* Added scroll for comments */}
                {comments.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No comments yet. Be the first to add one!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-1">
                                <UserAvatar user={comment.user} size="small" />
                                <span className="font-medium text-gray-800">{comment.user?.name || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.text}</p>
                        </div>
                    ))
                )}
            </div>
            <form onSubmit={handleAddComment} className="mt-4 flex items-end space-x-2">
                <textarea
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows="2"
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    required
                ></textarea>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md h-fit"
                    disabled={submitting}
                >
                    {submitting ? 'Adding...' : 'Post'}
                </button>
            </form>
        </div>
    );
};


// Ticket Detail Modal component (for viewing and editing)
const TicketDetailModal = ({ isOpen, onClose, ticket, projectMembers, onTicketUpdated, onTicketDeleted }) => { // Added onTicketDeleted
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); // State for delete confirmation

    if (!isOpen || !ticket) return null;

    const handleTicketUpdate = (updatedTicket) => {
        onTicketUpdated(updatedTicket);
        setIsEditing(false); // Exit editing mode after update
    };

    const handleDeleteClick = () => {
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsConfirmDeleteOpen(false); // Close confirmation modal
        await onTicketDeleted(ticket._id); // Call the delete function
        onClose(); // Close the detail modal after deletion
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600';
            case 'Critical': return 'text-red-800 font-bold';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'To Do': return 'bg-gray-200 text-gray-800';
            case 'In Progress': return 'bg-blue-200 text-blue-800';
            case 'Done': return 'bg-green-200 text-green-800';
            case 'Blocked': return 'bg-red-200 text-red-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };


    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                {isEditing ? (
                    <EditTicketForm
                        ticket={ticket}
                        projectMembers={projectMembers}
                        onTicketUpdated={handleTicketUpdate}
                        onClose={() => setIsEditing(false)} // Allow cancelling edit
                    />
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">{ticket.title}</h2>
                        <p className="text-gray-700"><strong>Description:</strong> {ticket.description || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(ticket.status)}`}>{ticket.status}</span></p>
                        <p className="text-gray-700"><strong>Priority:</strong> <span className={`${getPriorityColor(ticket.priority)} font-medium`}>{ticket.priority}</span></p>
                        <div className="flex items-center text-gray-700">
                            <strong>Assignee:</strong>
                            {ticket.assignee && (
                                <>
                                    <UserAvatar user={ticket.assignee} size="small" className="ml-2 mr-1" />
                                    <span>{ticket.assignee?.name || 'Unassigned'} ({ticket.assignee?.email || ''})</span>
                                </>
                            )}
                            {!ticket.assignee && <span>Unassigned</span>}
                        </div>
                        <div className="flex items-center text-gray-700">
                            <strong>Reporter:</strong>
                            {ticket.reporter && (
                                <>
                                    <UserAvatar user={ticket.reporter} size="small" className="ml-2 mr-1" />
                                    <span>{ticket.reporter?.name || 'N/A'} ({ticket.reporter?.email || ''})</span>
                                </>
                            )}
                            {!ticket.reporter && <span>N/A</span>}
                        </div>
                        <p className="text-gray-700"><strong>Type:</strong> {ticket.type}</p>
                        <p className="text-gray-700"><strong>Due Date:</strong> {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-gray-700"><strong>Created At:</strong> {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString()}</p>
                        <p className="text-gray-700"><strong>Last Updated:</strong> {new Date(ticket.updatedAt).toLocaleDateString()} {new Date(ticket.updatedAt).toLocaleTimeString()}</p>
                        <div className="flex space-x-4 mt-4">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md flex-1"
                            >
                                Edit Ticket
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md flex-1"
                            >
                                Delete Ticket
                            </button>
                        </div>
                        {/* Comments Section */}
                        <CommentsSection ticketId={ticket._id} />
                    </div>
                )}
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                message={`Are you sure you want to delete ticket "${ticket.title}"? This action cannot be undone.`}
            />
        </>
    );
};


// SortableTicket component (draggable ticket item)
const SortableTicket = ({ ticket, onTicketView }) => { // Added onTicketView prop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0, // Ensure dragging item is on top
    opacity: isDragging ? 0.8 : 1,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Critical': return 'text-red-800 font-bold';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-200 text-gray-800';
      case 'In Progress': return 'bg-blue-200 text-blue-800';
      case 'Done': return 'bg-green-200 text-green-800';
      case 'Blocked': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition duration-200 ease-in-out ${isDragging ? 'dragging-ticket' : ''}`}
    >
      <h4 className="font-semibold text-gray-800 mb-1">{ticket.title}</h4>
      <p className="text-sm text-gray-600 mb-2 truncate">{ticket.description || 'No description.'}</p>
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <span>Reporter:</span>
        {ticket.reporter && (
            <>
                <UserAvatar user={ticket.reporter} size="small" className="ml-2 mr-1" />
                <span>{ticket.reporter?.name || 'N/A'}</span>
            </>
        )}
        {!ticket.reporter && <span>N/A</span>}
      </div>
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <span>Assignee:</span>
        {ticket.assignee && (
            <>
                <UserAvatar user={ticket.assignee} size="small" className="ml-2 mr-1" />
                <span>{ticket.assignee?.name || 'Unassigned'}</span>
            </>
        )}
        {!ticket.assignee && <span>Unassigned</span>}
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
        <span className={`${getPriorityColor(ticket.priority)}`}>Priority: {ticket.priority}</span>
      </div>
      <div className="mt-3 flex justify-end space-x-2">
        <button
          onClick={() => onTicketView(ticket)} // Call onTicketView with the ticket object
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium py-1 px-3 rounded-md bg-indigo-50 hover:bg-indigo-100 transition duration-200 ease-in-out"
        >
          View
        </button>
        {/* Removed Edit button from here, it's now inside the detail modal */}
      </div>
    </div>
  );
};


// Column component for Kanban Board
const KanbanColumn = ({ id, name, color, items, onAddTicket, onTicketView }) => { // Added onTicketView
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const columnItems = useMemo(() => items.map(ticket => ticket._id), [items]);

  return (
    <div className="flex-shrink-0 w-full md:w-80 bg-gray-100 rounded-lg p-4 shadow-md">
      <h3 className={`text-lg font-semibold text-white p-2 mb-4 rounded-lg ${color}`}>
        {name} ({items.length})
      </h3>
      <div
        ref={setNodeRef}
        className={`space-y-4 min-h-[50px] transition-colors duration-200 ease-in-out ${isOver ? 'dragging-over-column' : ''}`}
      >
        <SortableContext
          items={columnItems}
          strategy={verticalListSortingStrategy}
        >
          {items.length > 0 ? (
            items.map((ticket) => (
              <SortableTicket key={ticket._id} ticket={ticket} onTicketView={onTicketView} /> // Pass onTicketView
            ))
          ) : (
            <p className="text-center text-gray-500 italic">No tickets here.</p>
          )}
        </SortableContext>
        {/* Placeholder from useDroppable should be handled by min-height and proper rendering of items */}
      </div>
      <button
        onClick={onAddTicket}
        className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition duration-200 ease-in-out flex items-center justify-center mt-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Ticket
      </button>
    </div>
  );
};


// Kanban Board Component
const KanbanBoard = ({ tickets, onTicketStatusChange, onAddTicket, setTickets, onTicketView }) => { // Added onTicketView
  const statuses = useMemo(() => ['To Do', 'In Progress', 'Done', 'Blocked'], []);

  const columns = useMemo(() => {
    const initialColumns = {};
    statuses.forEach(status => {
      initialColumns[status] = {
        id: status,
        name: status,
        color:
          status === 'To Do' ? 'bg-gray-500' :
          status === 'In Progress' ? 'bg-blue-500' :
          status === 'Done' ? 'bg-green-500' :
          'bg-red-500', // Blocked
        items: [],
      };
    });

    // Sort tickets within each column by a 'createdAt' or 'order' field if available, for consistent rendering
    // For now, let's keep the order of insertion if no explicit order field is present.
    tickets.forEach(ticket => {
      if (initialColumns[ticket.status]) {
        initialColumns[ticket.status].items.push(ticket);
      } else {
        initialColumns['To Do'].items.push(ticket); // Fallback
      }
    });
    return initialColumns;
  }, [tickets, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Ensure IDs are strings before comparison
    if (typeof activeId !== 'string' || typeof overId !== 'string') {
        console.warn("Invalid draggableId or droppableId encountered:", activeId, overId);
        return;
    }

    // Find the source column ID from the active draggable's data
    const sourceColumnId = active.data.current?.sortable?.containerId;
    const destinationColumnId = over.id; // The ID of the Droppable (column)


    // Case 1: Moving between different columns (status change)
    if (sourceColumnId && destinationColumnId && sourceColumnId !== destinationColumnId) {
        onTicketStatusChange(activeId, destinationColumnId);
    }
    // Case 2: Reordering within the same column
    else if (sourceColumnId && destinationColumnId && sourceColumnId === destinationColumnId) {
        setTickets(prevTickets => {
            const currentColumnTickets = prevTickets.filter(ticket => ticket.status === sourceColumnId);
            const currentColumnItemIds = currentColumnTickets.map(ticket => ticket._id);

            const oldIndex = currentColumnItemIds.indexOf(activeId);
            const newIndex = currentColumnItemIds.indexOf(overId);

            if (oldIndex === -1 || newIndex === -1) {
                return prevTickets;
            }

            const reorderedColumnItemIds = arrayMove(currentColumnItemIds, oldIndex, newIndex);

            const ticketMap = new Map(prevTickets.map(ticket => [ticket._id, ticket]));

            const reorderedColumnTickets = reorderedColumnItemIds.map(id => ({
                ...ticketMap.get(id), // Keep all existing ticket properties
                // Potentially add an 'order' field here if you were persisting order to backend
            }));

            // Filter out the old column tickets from the entire list and combine with reordered
            // This ensures all tickets are present, and the order is updated only within the affected column.
            const otherTickets = prevTickets.filter(ticket => ticket.status !== sourceColumnId);
            return [...otherTickets, ...reorderedColumnTickets];
        });
        console.log(`Reordered ticket ${activeId} within column ${sourceColumnId}`);
    }
  }, [onTicketStatusChange, setTickets]); // Removed 'statuses' from dependency array as it is a stable memoized value


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4">
        {statuses.map((statusId) => {
          const column = columns[statusId];
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              name={column.name}
              color={column.color}
              items={column.items}
              onAddTicket={onAddTicket}
              onTicketView={onTicketView} // Pass onTicketView to column
            />
          );
        })}
      </div>
    </DndContext>
  );
};


// Manage Team Members Modal Component
const ManageTeamMembersModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const currentUser = getCurrentUser(); // Get current user to exclude from selection

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const token = getToken();
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/users`, config);
                // Filter out the current project's owner and existing team members
                const currentMemberIds = new Set([
                    project.owner?._id,
                    ...(project.teamMembers || []).map(member => member._id)
                ]);
                const availableUsers = response.data.filter(user => !currentMemberIds.has(user._id));
                setAllUsers(availableUsers);
                if (availableUsers.length > 0) {
                    setSelectedUserId(availableUsers[0]._id);
                }
            } catch (err) {
                console.error('Error fetching all users:', err);
                setMessage('Failed to load users.');
            }
        };

        if (isOpen && project) {
            fetchAllUsers();
        }
    }, [isOpen, project]);

    const handleAddMember = async () => {
        if (!selectedUserId) {
            setMessage('Please select a user to add.');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${API_BASE_URL}/projects/${project._id}/add-member`,
                { userId: selectedUserId },
                config
            );
            setMessage('Member added successfully!');
            onProjectUpdated(response.data); // Update project in parent state
            // Re-fetch all users to update the dropdown (remove added user)
            const updatedAllUsers = allUsers.filter(user => user._id !== selectedUserId);
            setAllUsers(updatedAllUsers);
            if (updatedAllUsers.length > 0) {
                setSelectedUserId(updatedAllUsers[0]._id);
            } else {
                setSelectedUserId('');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to add member.');
            console.error('Error adding member:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userIdToRemove) => {
        setLoading(true);
        setMessage('');
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${API_BASE_URL}/projects/${project._id}/remove-member`,
                { userId: userIdToRemove },
                config
            );
            setMessage('Member removed successfully!');
            onProjectUpdated(response.data); // Update project in parent state
            // Add removed user back to allUsers list if not already there
            const removedUser = project.teamMembers.find(member => member._id === userIdToRemove);
            if (removedUser) {
                setAllUsers(prevUsers => [...prevUsers, removedUser]);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to remove member.');
            console.error('Error removing member:', error);
        } finally {
            setLoading(false);
        }
    };

    const isOwner = currentUser && project.owner?._id === currentUser._id;

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Team Members for "{project.title}"</h2>
            {message && <p className={`mb-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Members:</h3>
                {project.teamMembers && project.teamMembers.length > 0 ? (
                    <ul className="space-y-2">
                        {project.teamMembers.map(member => (
                            <li key={member._id} className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <UserAvatar user={member} size="small" />
                                    <span className="text-gray-700">{member.name} ({member.email})</span>
                                </div>
                                {isOwner && member._id !== project.owner?._id && ( // Only owner can remove, and not the owner themselves
                                    <button
                                        onClick={() => handleRemoveMember(member._id)}
                                        className="bg-red-400 text-white px-3 py-1 text-sm rounded-md hover:bg-red-500 transition duration-200 ease-in-out"
                                        disabled={loading}
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">No team members added yet.</p>
                )}
            </div>

            {isOwner && ( // Only owner can add new members
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Member:</h3>
                    <div className="flex space-x-2">
                        <select
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={loading || allUsers.length === 0}
                        >
                            {allUsers.length > 0 ? (
                                allUsers.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))
                            ) : (
                                <option value="">No more users to add</option>
                            )}
                        </select>
                        <button
                            onClick={handleAddMember}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md"
                            disabled={loading || !selectedUserId}
                        >
                            Add Member
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


// Edit Project Form Component
const EditProjectForm = ({ isOpen, onClose, project, onProjectUpdated }) => {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                setMessage('Not authenticated. Please log in.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const updatedProject = { title, description };
            const response = await axios.put(`${API_BASE_URL}/projects/${project._id}`, updatedProject, config);
            setMessage('Project updated successfully!');
            onProjectUpdated(response.data); // Update project in parent state
            onClose();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update project');
            console.error('Project update error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Project Details</h2>
            {message && <p className={`mb-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editProjectTitle">Title</label>
                    <input
                        type="text"
                        id="editProjectTitle"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="editProjectDescription">Description</label>
                    <textarea
                        id="editProjectDescription"
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-md"
                    disabled={loading}
                >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </form>
        </Modal>
    );
};


// Admin Panel Component for User Role Management
const AdminPanel = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // For update messages

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const token = getToken();
            if (!token) {
                setError('Authentication required to view users.');
                setLoading(false);
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/users`, config); // This endpoint must be admin-protected
            setUsers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users. You might not have admin privileges.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchAllUsers();
        } else {
            setError('You do not have administrative privileges to view this page.');
            setLoading(false);
        }
    }, [currentUser, fetchAllUsers]);

    const handleRoleChange = async (userId, newRole) => {
        setMessage('');
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${API_BASE_URL}/users/${userId}/role`, { role: newRole }, config);
            setMessage(`Role for ${response.data.name} updated to ${response.data.role}`);
            // Update the user list in state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === response.data._id ? response.data : user
                )
            );
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to update role.');
            console.error('Error updating role:', err);
        }
    };

    if (loading) return <div className="text-center text-gray-500 p-6">Loading Admin Panel...</div>;
    if (error) return <div className="text-center text-red-600 p-6">{error}</div>;
    if (currentUser?.role !== 'admin') return <div className="text-center text-red-600 p-6">Access Denied: You must be an administrator to view this page.</div>;

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel: User Management</h2>
            {message && <p className={`mb-4 text-center ${message.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div className="bg-white p-6 rounded-lg shadow-xl overflow-x-auto">
                {users.length === 0 ? (
                    <p className="text-center text-gray-500 italic">No users found.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-3">
                                        <UserAvatar user={user} size="small" />
                                        <span>{user.name}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {user.role}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {user._id === currentUser._id ? (
                                            <span className="text-gray-500 italic">Cannot change own role</span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                disabled={loading}
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};


// New Global Dashboard Component
const GlobalDashboard = () => {
  const [projectsCount, setProjectsCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [ticketsByStatusData, setTicketsByStatusData] = useState([]);
  const [ticketsByPriorityData, setTicketsByPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define colors for Pie Chart slices
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#f44336']; // Indigo, Green, Yellow, Orange, Red

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        if (!token) {
          setError('User not authenticated. Please log in.');
          setLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, config);
        setProjectsCount(projectsResponse.data.length);

        const allTicketsResponse = await axios.get(`${API_BASE_URL}/tickets/all`, config);
        const allTickets = allTicketsResponse.data;
        setTicketsCount(allTickets.length);

        // Process data for Tickets by Status Chart
        const statusCounts = allTickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1;
          return acc;
        }, {});
        const statusData = Object.keys(statusCounts).map(status => ({
          name: status,
          value: statusCounts[status]
        }));
        setTicketsByStatusData(statusData);

        // Process data for Tickets by Priority Chart
        const priorityCounts = allTickets.reduce((acc, ticket) => {
          acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
          return acc;
        }, {});
        const priorityData = Object.keys(priorityCounts).map(priority => ({
          name: priority,
          value: priorityCounts[priority]
        }));
        setTicketsByPriorityData(priorityData);

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center text-gray-500 p-6">Loading dashboard data...</div>;
  if (error) return <div className="text-center text-red-600 p-6">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Global Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card for Total Projects */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Projects</h3>
          <p className="text-5xl font-extrabold text-indigo-600">{projectsCount}</p>
          <p className="text-gray-500 mt-2">Number of projects you are part of.</p>
        </div>

        {/* Card for Total Tickets */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Tickets</h3>
          <p className="text-5xl font-extrabold text-green-600">{ticketsCount}</p>
          <p className="text-gray-500 mt-2">All tickets across your projects.</p>
        </div>

        {/* Tickets by Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ticketsByStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
          {ticketsByStatusData.length === 0 && <p className="text-center text-gray-500 italic mt-2">No tickets to display.</p>}
        </div>

        {/* Tickets by Priority Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ticketsByPriorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {
                  ticketsByPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))
                }
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {ticketsByPriorityData.length === 0 && <p className="text-center text-gray-500 italic mt-2">No tickets to display.</p>}
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-1 md:col-span-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <ActivityFeed />
        </div>

      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-100 text-blue-800 px-6 py-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 ease-in-out font-medium">
            View All Open Tickets
          </button>
          <button className="bg-purple-100 text-purple-800 px-6 py-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 ease-in-out font-medium">
            My Assigned Tickets
          </button>
        </div>
      </div>
    </div>
  );
};


// New MyTicketsView Component
const MyTicketsView = () => {
    const [myTickets, setMyTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [allProjectMembers, setAllProjectMembers] = useState([]); // To pass to TicketDetailModal

    const currentUser = getCurrentUser();

    // Helper to fetch all tickets assigned to the current user
    const fetchMyTickets = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!currentUser) {
            setError('User not logged in.');
            setLoading(false);
            return;
        }

        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch all tickets. Then filter by assignee on the frontend.
            // In a real application with many tickets, you might have a backend endpoint
            // like /api/tickets/assigned-to-me or /api/tickets?assignee=<currentUserId>
            const allTicketsResponse = await axios.get(`${API_BASE_URL}/tickets/all`, config);
            const userAssignedTickets = allTicketsResponse.data.filter(ticket =>
                ticket.assignee && ticket.assignee._id === currentUser._id
            );
            setMyTickets(userAssignedTickets);

            // Collect all unique members from all projects for the assignee dropdown in TicketDetailModal
            const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, config);
            const membersMap = new Map();
            projectsResponse.data.forEach(project => {
                if (project.owner) {
                    membersMap.set(project.owner._id, project.owner);
                }
                project.teamMembers.forEach(member => {
                    membersMap.set(member._id, member);
                });
            });
            setAllProjectMembers(Array.from(membersMap.values()));

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch your tickets.');
            console.error('Error fetching my tickets:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMyTickets();
    }, [fetchMyTickets]);

    const handleTicketView = (ticket) => {
        setSelectedTicket(ticket);
        setIsTicketDetailModalOpen(true);
    };

    const handleTicketUpdated = (updatedTicket) => {
        setMyTickets(prevTickets =>
            prevTickets.map(ticket =>
                ticket._id === updatedTicket._id ? updatedTicket : ticket
            )
        );
        setSelectedTicket(updatedTicket);
        setIsTicketDetailModalOpen(false);
    };

    const handleTicketDeleted = async (ticketId) => {
        try {
            const token = getToken();
            if (!token) {
                console.error('Not authenticated. Cannot delete ticket.');
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_BASE_URL}/tickets/${ticketId}`, config);
            setMyTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketId));
            setSelectedTicket(null);
        } catch (error) {
            console.error('Failed to delete ticket:', error);
            setError('Failed to delete ticket. Please try again.');
            fetchMyTickets();
        }
    };


    const filteredAndSearchedTickets = useMemo(() => {
        let currentTickets = myTickets;

        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            currentTickets = currentTickets.filter(ticket =>
                ticket.title.toLowerCase().includes(lowercasedSearchTerm) ||
                ticket.description?.toLowerCase().includes(lowercasedSearchTerm) ||
                ticket.project?.title.toLowerCase().includes(lowercasedSearchTerm) // Search by project title too
            );
        }

        if (filterStatus) {
            currentTickets = currentTickets.filter(ticket => ticket.status === filterStatus);
        }

        if (filterPriority) {
            currentTickets = currentTickets.filter(ticket => ticket.priority === filterPriority);
        }

        return currentTickets;
    }, [myTickets, searchTerm, filterStatus, filterPriority]);


    if (loading) return <div className="text-center text-gray-500 p-6">Loading your tickets...</div>;
    if (error) return <div className="text-center text-red-600 p-6">{error}</div>;

    return (
        <div className="p-6">
            <Header title="My Assigned Tickets" />

            {/* Search and Filter Controls for My Tickets */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="myTicketsSearchTerm" className="block text-sm font-medium text-gray-700">Search Tickets</label>
                    <input
                        type="text"
                        id="myTicketsSearchTerm"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Search by title, description, or project"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="myTicketsFilterStatus" className="block text-sm font-medium text-gray-700">Filter by Status</label>
                    <select
                        id="myTicketsFilterStatus"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="myTicketsFilterPriority" className="block text-sm font-medium text-gray-700">Filter by Priority</label>
                    <select
                        id="myTicketsFilterPriority"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>

            {filteredAndSearchedTickets.length === 0 ? (
                <p className="text-center text-gray-500 italic mt-8">No tickets assigned to you found matching your criteria.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSearchedTickets.map(ticket => (
                        <div key={ticket._id}
                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out border border-gray-200 flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">{ticket.title}</h3>
                                <p className="text-sm text-gray-600 mb-2 truncate">{ticket.description || 'No description.'}</p>
                                <p className="text-xs text-gray-500 mb-2">Project: {ticket.project?.title || 'N/A'}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs
                                    ${ticket.status === 'To Do' ? 'bg-gray-200 text-gray-800' :
                                      ticket.status === 'In Progress' ? 'bg-blue-200 text-blue-800' :
                                      ticket.status === 'Done' ? 'bg-green-200 text-green-800' :
                                      'bg-red-200 text-red-800'}`
                                }>{ticket.status}</span>
                                <span className={`text-xs font-medium
                                    ${ticket.priority === 'High' ? 'text-red-600' :
                                      ticket.priority === 'Critical' ? 'text-red-800 font-bold' :
                                      ticket.priority === 'Medium' ? 'text-yellow-600' :
                                      'text-green-600'}`
                                }>Priority: {ticket.priority}</span>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => handleTicketView(ticket)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium py-1 px-3 rounded-md bg-indigo-50 hover:bg-indigo-100 transition duration-200 ease-in-out"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TicketDetailModal
                isOpen={isTicketDetailModalOpen}
                onClose={() => setIsTicketDetailModalOpen(false)}
                ticket={selectedTicket}
                projectMembers={allProjectMembers}
                onTicketUpdated={handleTicketUpdated}
                onTicketDeleted={handleTicketDeleted}
            />
        </div>
    );
};


// Component to display a single project's details and its tickets
const ProjectDetails = ({ projectId, onBackToProjects, allProjects, onSelectProject, onProjectUpdated, notifications = [] }) => {
  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]); // State for tickets
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false); // State for detail modal
  const [selectedTicket, setSelectedTicket] = useState(null); // State for selected ticket for detail view/edit
  const [isManageTeamMembersModalOpen, setIsManageTeamMembersModalOpen] = useState(false); // State for team member modal
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false); // New state for edit project modal
  const [isConfirmDeleteProjectOpen, setIsConfirmDeleteProjectOpen] = useState(false); // New state for delete project confirmation

  // States for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const currentUser = getCurrentUser(); // Get current user for ownership check

  // Function to fetch project and tickets
  const fetchProjectAndTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('User not authenticated. Please log in.');
        setLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch project details
      const projectResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}`, config);
      setProject(projectResponse.data);

      // Fetch tickets for this project
      const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets/${projectId}`, config);
      setTickets(ticketsResponse.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details or tickets');
      console.error('Error fetching project/tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndTickets();
    }
  }, [projectId, fetchProjectAndTickets]);


  const handleTicketCreated = (newTicket) => {
    setTickets((prevTickets) => [...prevTickets, newTicket]);
    setIsTicketFormOpen(false);
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      const token = getToken();
      if (!token) {
        console.error('Not authenticated. Cannot update ticket status.');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Update ticket status via API
      await axios.put(`${API_BASE_URL}/tickets/${ticketId}`, { status: newStatus }, config);

      // Optimistically update frontend state
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
      // If the selected ticket in the modal was the one changed, update it too
      if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      setError('Failed to update ticket status. Please try again.');
      fetchProjectAndTickets(); // Re-fetch to ensure data consistency
    }
  };

  const handleTicketUpdated = (updatedTicket) => {
      setTickets(prevTickets =>
          prevTickets.map(ticket =>
              ticket._id === updatedTicket._id ? updatedTicket : ticket
          )
      );
      setSelectedTicket(updatedTicket); // Update selected ticket in modal
      setIsTicketDetailModalOpen(false); // Close modal after update
  };

  const handleTicketDeleted = async (ticketId) => {
      try {
          const token = getToken();
          if (!token) {
              console.error('Not authenticated. Cannot delete ticket.');
              return;
          }
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.delete(`${API_BASE_URL}/tickets/${ticketId}`, config);
          setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketId));
          setSelectedTicket(null); // Clear selected ticket
          // No need to close modal here, it's done by the caller (TicketDetailModal)
      } catch (error) {
          console.error('Failed to delete ticket:', error);
          setError('Failed to delete ticket. Please try again.');
          // Optionally re-fetch tickets to ensure state consistency if deletion failed
          fetchProjectAndTickets();
      }
  };

  // Handles updates to the project (e.g., title, description, team members)
  const handleProjectDetailUpdated = (updatedProject) => {
    setProject(updatedProject); // Update the local project state
    onProjectUpdated(updatedProject); // Propagate up to App component to update global projects list
  };

  const handleTicketView = (ticket) => {
      setSelectedTicket(ticket);
      setIsTicketDetailModalOpen(true);
  };

  const handleDeleteProjectClick = () => {
      setIsConfirmDeleteProjectOpen(true);
  };

  const handleConfirmDeleteProject = async () => {
      setIsConfirmDeleteProjectOpen(false); // Close confirmation modal
      try {
          const token = getToken();
          if (!token) {
              console.error('Not authenticated. Cannot delete project.');
              return;
          }
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.delete(`${API_BASE_URL}/projects/${projectId}`, config);
          // After successful deletion, navigate back to the projects dashboard
          onBackToProjects();
          onProjectUpdated(null); // Indicate that the project has been deleted from the global list
      } catch (error) {
          console.error('Failed to delete project:', error);
          setError('Failed to delete project. Please try again.');
      }
  };

  // Memoized filtered and searched tickets
  const filteredTickets = useMemo(() => {
    let currentTickets = tickets;

    // Apply search term
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentTickets = currentTickets.filter(ticket =>
        ticket.title.toLowerCase().includes(lowercasedSearchTerm) ||
        ticket.description?.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // Apply status filter
    if (filterStatus) {
      currentTickets = currentTickets.filter(ticket => ticket.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority) {
      currentTickets = currentTickets.filter(ticket => ticket.priority === filterPriority);
    }

    // Apply assignee filter
    if (filterAssignee) {
      currentTickets = currentTickets.filter(ticket => ticket.assignee?._id === filterAssignee);
    }

    return currentTickets;
  }, [tickets, searchTerm, filterStatus, filterPriority, filterAssignee]);


  if (loading) return <div className="text-center text-gray-500">Loading project...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!project) return <div className="text-center text-gray-500">Project not found.</div>;

  const projectMembers = project?.owner ? [project.owner, ...project.teamMembers].filter((member, index, self) => member && self.findIndex(m => m._id === member._id) === index) : project?.teamMembers || [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center">
        <button
          onClick={onBackToProjects}
          className="text-gray-600 hover:text-indigo-600 mr-2 focus:outline-none"
          title="Back to Projects"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-gray-800">{project.title}</h2>

        {/* Project Selector Dropdown */}
        <div className="ml-4 flex items-center">
            <label htmlFor="project-selector" className="sr-only">Select Project</label>
            <select
                id="project-selector"
                value={projectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="block w-auto py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {allProjects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                        {proj.title}
                    </option>
                ))}
            </select>
        </div>
      </div>
      <p className="text-gray-600 text-lg mb-6">{project.description}</p>

      {/* Notifications Section */}
      {notifications && notifications.length > 0 && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Notifications</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {notifications.map((notification) => (
              <div key={notification._id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-500 flex items-start">
                <div className="flex-1">
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Details</h3>
        <p className="text-gray-700 mb-2"><strong>Owner:</strong>
            {project.owner && (
                <span className="ml-2 inline-flex items-center space-x-2">
                    <UserAvatar user={project.owner} size="small" />
                    <span>{project.owner?.name || 'N/A'} ({project.owner?.email || ''})</span>
                </span>
            )}
            {!project.owner && <span>N/A</span>}
        </p>
        <p className="text-gray-700 mb-2"><strong>Status:</strong> {project.status}</p>
        <div className="mb-2">
            <h4 className="font-medium text-gray-700">Team Members:</h4>
            {project.teamMembers.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600 ml-4">
                    {project.teamMembers.map(member => (
                        <li key={member._id} className="flex items-center space-x-2">
                            <UserAvatar user={member} size="small" />
                            <span>{member.name} ({member.email})</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 italic ml-4">No team members added yet.</p>
            )}
        </div>
        <div className="flex space-x-4 mt-4">
            {/* Button to manage team members */}
            {project.owner?._id === currentUser?._id && ( // Only show if current user is the project owner
                <button
                    onClick={() => setIsManageTeamMembersModalOpen(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
                >
                    Manage Team Members
                </button>
            )}
            {/* Button to edit project details */}
            {project.owner?._id === currentUser?._id && ( // Only show if current user is the project owner
                <button
                    onClick={() => setIsEditProjectModalOpen(true)}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
                >
                    Edit Project Details
                </button>
            )}
            {/* Button to delete project */}
            {project.owner?._id === currentUser?._id && ( // Only show if current user is the project owner
                <button
                    onClick={handleDeleteProjectClick}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
                >
                    Delete Project
                </button>
            )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Kanban Board</h3>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            id="searchTerm"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="filterStatus"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>

        <div>
          <label htmlFor="filterPriority" className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="filterPriority"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor="filterAssignee" className="block text-sm font-medium text-gray-700">Assignee</label>
          <select
            id="filterAssignee"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {projectMembers.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>

      <KanbanBoard
        tickets={filteredTickets} // Pass filtered tickets to KanbanBoard
        onTicketStatusChange={handleTicketStatusChange}
        onAddTicket={() => setIsTicketFormOpen(true)}
        setTickets={setTickets} // Pass setTickets down to KanbanBoard
        onTicketView={handleTicketView} // Pass handleTicketView to KanbanBoard
      />

      <Modal isOpen={isTicketFormOpen} onClose={() => setIsTicketFormOpen(false)}>
        <TicketForm
          projectId={projectId}
          onTicketCreated={handleTicketCreated}
          onClose={() => setIsTicketFormOpen(false)}
        />
      </Modal>

      {/* Ticket Detail/Edit Modal */}
      <TicketDetailModal
        isOpen={isTicketDetailModalOpen}
        onClose={() => setIsTicketDetailModalOpen(false)}
        ticket={selectedTicket}
        projectMembers={projectMembers} // Pass project members for assignee dropdown
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted} // Pass handleTicketDeleted
      />

      {/* Manage Team Members Modal */}
      <ManageTeamMembersModal
        isOpen={isManageTeamMembersModalOpen}
        onClose={() => setIsManageTeamMembersModalOpen(false)}
        project={project}
        onProjectUpdated={handleProjectDetailUpdated} // Callback to update project state in ProjectDetails
      />

      {/* Edit Project Details Modal */}
      {project && ( // Only render if project data is loaded
          <EditProjectForm
              isOpen={isEditProjectModalOpen}
              onClose={() => setIsEditProjectModalOpen(false)}
              project={project}
              onProjectUpdated={handleProjectDetailUpdated} // Callback to update project state
          />
      )}

      {/* Delete Project Confirmation Modal */}
      {project && (
          <ConfirmationModal
              isOpen={isConfirmDeleteProjectOpen}
              onClose={() => setIsConfirmDeleteProjectOpen(false)}
              onConfirm={handleConfirmDeleteProject}
              message={`Are you sure you want to delete project "${project.title}"? This action cannot be undone and will delete all associated tickets.`}
              confirmText="Yes, Delete Project"
              cancelText="No, Keep Project"
          />
      )}
    </div>
  );
};


const App = () => {
  const [currentPage, setCurrentPage] = useState('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  // Use a state for the current user to allow updates from UserProfile component
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);


  // Effect to update currentUser state if localStorage changes (e.g., after login/registration)
  useEffect(() => {
    const handleStorageChange = () => {
      // Re-fetch user data including role from localStorage
      setCurrentUser(getCurrentUser());
    };
    // Listen for changes to localStorage (not all browsers fire this for other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Initialize socket connection and set up event listeners
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      const socket = initSocket();
      
      // Listen for notification events
      socket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        // Add the new notification to state
        setNotifications(prev => [notification, ...prev]);
        // Increment unread count
        setUnreadNotificationsCount(prev => prev + 1);
        // You could also show a toast notification here
      });
      
      // Listen for ticket events
      socket.on('ticket-created', (data) => {
        console.log('Ticket created:', data);
        // Handle ticket creation - could update ticket lists if viewing the relevant project
      });
      
      socket.on('ticket-updated', (data) => {
        console.log('Ticket updated:', data);
        // Handle ticket update - could update ticket data in the UI
      });
      
      socket.on('ticket-deleted', (data) => {
        console.log('Ticket deleted:', data);
        // Handle ticket deletion - could remove the ticket from UI
      });
      
      // Clean up socket connection on unmount
      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated]);
  
  // Handle joining and leaving project rooms when selectedProjectId changes
  useEffect(() => {
    if (isAuthenticated && selectedProjectId) {
      joinProjectRoom(selectedProjectId);
      
      // Clean up when component unmounts or project changes
      return () => {
        leaveProjectRoom(selectedProjectId);
      };
    }
  }, [isAuthenticated, selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const token = getToken();
      if (!token) {
        setProjectsError('User not authenticated. Please log in.');
        setProjectsLoading(false);
        return;
      }
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await axios.get(`${API_BASE_URL}/projects`, config);
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(response.data[0]._id);
      }
    } catch (err) {
      setProjectsError(err.response?.data?.message || 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
      setSelectedProjectId(null);
    } finally {
      setProjectsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);


  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
    // After successful login/registration, ensure currentUser state is updated with role
    setCurrentUser(getCurrentUser());
    setCurrentPage('projects');
    fetchProjects();
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
    setSelectedProjectId(newProject._id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Clear user object including role
    setIsAuthenticated(false);
    setProjects([]);
    setSelectedProjectId(null);
    setCurrentUser(null); // Clear current user on logout
    setCurrentPage('projects');
    // Disconnect socket on logout
    disconnectSocket();
  };

  // Callback to update a project in the global projects state (used by ManageTeamMembersModal via ProjectDetails)
  const updateProjectInList = useCallback((updatedProject) => {
    if (updatedProject === null) { // Special case for deletion
        // Leave the project room before removing it
        leaveProjectRoom(selectedProjectId);
        setProjects(prevProjects => prevProjects.filter(p => p._id !== selectedProjectId));
        setSelectedProjectId(null); // Clear selected project as it's deleted
    } else {
        setProjects(prevProjects =>
            prevProjects.map(project =>
                project._id === updatedProject._id ? updatedProject : project
            )
        );
    }
  }, [selectedProjectId]); // Depend on selectedProjectId to ensure correct filtering on delete

  // Callback to update the current user in App state and local storage
  const handleUserUpdated = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser)); // Update user in local storage
  }, []);

  const renderPage = () => {
    if (!isAuthenticated) {
        return <RegisterForm onRegisterSuccess={handleRegisterSuccess} />;
    }

    // If a project is selected, always show ProjectDetails
    if (selectedProjectId) {
      return (
        <ProjectDetails
          projectId={selectedProjectId}
          onBackToProjects={() => {
            leaveProjectRoom(selectedProjectId);
            setSelectedProjectId(null);
          }}
          allProjects={projects}
          onSelectProject={(projectId) => {
            if (selectedProjectId) {
              leaveProjectRoom(selectedProjectId);
            }
            setSelectedProjectId(projectId);
            joinProjectRoom(projectId);
          }}
          onProjectUpdated={updateProjectInList} // Pass the update function
          notifications={notifications.filter(n => n.relatedProject === selectedProjectId)}
        />
      );
    }

    // Otherwise, render based on currentPage
    switch (currentPage) {
      case 'projects':
        return (
            <>
                <ProjectDashboard
                    onSelectProject={setSelectedProjectId}
                    onAddProject={() => setIsProjectFormOpen(true)}
                    projects={projects}
                    loading={projectsLoading}
                    error={projectsError}
                />
                <Modal isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)}>
                    <CreateProjectForm
                        onProjectCreated={handleProjectCreated}
                        onClose={() => setIsProjectFormOpen(false)}
                    />
                </Modal>
            </>
        );
      case 'dashboard':
        return <GlobalDashboard />;
      case 'my-tickets':
          return <MyTicketsView />;
      case 'profile':
          return <UserProfile currentUser={currentUser} onUserUpdated={handleUserUpdated} />;
      case 'admin-panel': // New case for AdminPanel
          return <AdminPanel currentUser={currentUser} />;
      default:
        return (
            <>
                <ProjectDashboard
                    onSelectProject={setSelectedProjectId}
                    onAddProject={() => setIsProjectFormOpen(true)}
                    projects={projects}
                    loading={projectsLoading}
                    error={projectsError}
                />
                <Modal isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)}>
                    <CreateProjectForm
                        onProjectCreated={handleProjectCreated}
                        onClose={() => setIsProjectFormOpen(false)}
                    />
                </Modal>
            </>
        );
    }
  };

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          /* Custom scrollbar for better aesthetics */
          ::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          /* Added styles for dnd-kit feedback */
          .dragging-over-column {
            background-color: #e2e8f0; /* bg-gray-200 */
          }
          .dragging-ticket {
            background-color: #e0e7ff; /* bg-indigo-100 */
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
        `}
      </style>

      <div className="flex">
        {isAuthenticated && (
            <Sidebar
                onNavigate={setCurrentPage}
                currentUser={currentUser} // Pass currentUser here
            />
        )}
        <main className="flex-1 p-4 overflow-auto">
          {isAuthenticated && <Header title={selectedProjectId ? "Project Details" : "Projects"} onAddProject={() => setIsProjectFormOpen(true)} onLogout={handleLogout} />}
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// ActivityFeed Component
const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) {
                    setError('Not authenticated');
                    setLoading(false);
                    return;
                }

                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/activities`, config);
                setActivities(response.data);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError('Failed to load activities');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    if (loading) return <div className="text-center text-gray-500 p-2">Loading activities...</div>;
    if (error) return <div className="text-center text-red-600 p-2">{error}</div>;
    if (activities.length === 0) return <div className="text-center text-gray-500 italic">No recent activities.</div>;

    return (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
                <div key={activity._id} className="border-b border-gray-100 pb-2 last:border-0">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">{activity.user?.name || 'Unknown user'}</span> {activity.action}
                        {activity.target && <span className="font-medium"> {activity.target}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
};

// UserProfile Component
const UserProfile = ({ currentUser, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate passwords match if provided
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Only include password if it's provided
            const updateData = {
                name: formData.name,
                email: formData.email
            };
            
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await axios.put(`${API_BASE_URL}/users/${currentUser._id}`, updateData, config);
            
            // Update the user in the parent component
            if (onUserUpdated) {
                onUserUpdated(response.data);
            }
            
            setSuccess('Profile updated successfully');
            
            // Clear password fields after successful update
            setFormData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    {success}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-gray-500">(leave blank to keep current)</span>
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default App;
