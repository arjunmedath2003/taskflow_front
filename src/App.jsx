import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, LayoutDashboard, Trash2, Edit, Calendar as CalendarIcon, ChevronsLeft, X, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import taskflowLogo from './assets/taskflow.svg';
import "./App.css";

// API Configuration
const API_BASE_URL = 'https://taskflowback.netlify.app/.netlify/functions/api/';

// Reusable Modal Component
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// --- A custom hook to get window width ---
const useWindowWidth = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowWidth;
};


// Main App Component
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: [], priority: [] });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- API Helper Function ---
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        if (!response.ok) {
            if (response.status === 401) {
                // Token is invalid or expired
                handleLogout(true); // Force logout
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Handle responses that might not have a body (e.g., DELETE)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return; // No JSON content
    } catch (error) {
        console.error("API Fetch Error: ", error);
        // Propagate the error to be handled by the caller
        throw error;
    }
  }, [navigate]);

  // --- Initial Data Loading ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedLists, fetchedTasks] = await Promise.all([
                apiFetch('/api/lists'),
                apiFetch('/api/tasks')
            ]);
            
            // Map MongoDB's _id to id for frontend compatibility
            if (fetchedLists) setLists(fetchedLists.map(l => ({...l, id: l._id})));
            if (fetchedTasks) setTasks(fetchedTasks.map(t => ({...t, id: t._id})));
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            // Handle potential auth errors during initial fetch
        } finally {
            setIsLoading(false);
        }
      };
      fetchData();
    } else {
      navigate('/login');
    }
  }, [navigate, apiFetch]);

  // Effect to handle sidebar collapse on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // --- Memoized Filtering and Sorting ---
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => selectedListId === 'all' || task.listId === selectedListId)
      .filter(task => {
        if (filters.status.length === 0) return true;
        const statusMatch = filters.status.map(s => s === 'Completed').includes(task.isCompleted);
        return statusMatch;
      })
      .filter(task => {
        if (filters.priority.length === 0) return true;
        return filters.priority.includes(task.priority);
      })
      .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [tasks, selectedListId, filters, searchTerm]);

  // --- CRUD Handlers ---

  const handleAddTask = async (taskData) => {
    await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    // If we get here, the POST was successful. Now refetch.
    const fetchedTasks = await apiFetch('/api/tasks');
    if (fetchedTasks) {
        setTasks(fetchedTasks.map(t => ({...t, id: t._id})));
    }
  };
  
  const handleToggleTask = async (taskId) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
  
    await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...taskToUpdate, isCompleted: !taskToUpdate.isCompleted }),
    });

    // To provide instant feedback, we can update state locally first,
    // then refetch or update based on response. For simplicity, refetching is used.
    const fetchedTasks = await apiFetch('/api/tasks');
    if (fetchedTasks) {
        setTasks(fetchedTasks.map(t => ({...t, id: t._id})));
    }
  };

  const handleDeleteTask = async (taskId) => {
    await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    // Optimistic UI update can be done here, but refetching ensures consistency.
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleUpdateTask = async (updatedTaskData) => {
    await apiFetch(`/api/tasks/${updatedTaskData.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTaskData),
    });
    // Refetch to get the latest state
    const fetchedTasks = await apiFetch('/api/tasks');
    if (fetchedTasks) {
        setTasks(fetchedTasks.map(t => ({...t, id: t._id})));
    }
  };

  const handleAddList = async (listName) => {
    await apiFetch('/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name: listName }),
    });
    // Refetch lists
    const fetchedLists = await apiFetch('/api/lists');
    if (fetchedLists) {
        setLists(fetchedLists.map(l => ({...l, id: l._id})));
    }
  };

  const handleDeleteCategory = async (listId) => {
    await apiFetch(`/api/lists/${listId}`, { method: 'DELETE' });
    // Update both lists and tasks state
    setLists(lists.filter(list => list.id !== listId));
    setTasks(prevTasks => prevTasks.filter(task => task.listId !== listId));
    if (selectedListId === listId) setSelectedListId('all');
  };

  const handleChangePassword = async (passwords) => {
      // Return the promise from apiFetch so the modal can await it
      return apiFetch('/auth/changepassword', {
          method: 'POST',
          body: JSON.stringify(passwords)
      });
  }

  const handleLogout = (force = false) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      if (!force) setIsLogoutModalOpen(false);
      navigate('/login');
  }

  const selectedList = lists.find(list => list.id === selectedListId);

  return (
    <div className="dark font-sans">
      <div className="flex h-screen bg-stone-900 text-stone-200">
        <Sidebar 
          lists={lists} 
          selectedListId={selectedListId} 
          setSelectedListId={setSelectedListId}
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          onAddListClick={() => setIsAddListModalOpen(true)}
        />

        <div className="flex-1 flex flex-col h-screen">
          <Header
            user={user}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
            onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
            onAddTaskClick={() => setIsAddTaskModalOpen(true)}
            onLogoutRequest={() => setIsLogoutModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {selectedListId === 'all' ? 'All Tasks' : selectedList?.name || 'Tasks'}
                </h1>
                {selectedListId !== 'all' && selectedList?.name !== 'Personal' && (
                    <button 
                        onClick={() => setCategoryToDelete(selectedList)} 
                        className="p-2 rounded-md text-stone-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-stone-700"
                        aria-label="Delete Category"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            {isLoading ? (
                <div className="text-center py-8">Loading tasks...</div>
            ) : (
                <TaskList 
                  tasks={filteredTasks} lists={lists} selectedListId={selectedListId}
                  onToggleTask={handleToggleTask} onDeleteRequest={setTaskToDelete} onEditRequest={setTaskToEdit}
                />
            )}
          </main>
        </div>
        
        <EditTaskModal task={taskToEdit} lists={lists} isOpen={!!taskToEdit} onClose={() => setTaskToEdit(null)} onSave={handleUpdateTask} />
        <ConfirmDeleteModal task={taskToDelete} isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={handleDeleteTask} />
        <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} onAdd={handleAddTask} lists={lists} />
        <AddListModal isOpen={isAddListModalOpen} onClose={() => setIsAddListModalOpen(false)} onAdd={handleAddList} />
        <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onSave={handleChangePassword} />
        <ConfirmDeleteCategoryModal category={categoryToDelete} isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={handleDeleteCategory} />
        <ConfirmLogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogout} />
      </div>
    </div>
  );
}

// --- CHILD COMPONENTS ---

// Sidebar Component
const Sidebar = ({ lists, selectedListId, setSelectedListId, isCollapsed, onToggle, onAddListClick }) => {
    const Logo = () => (
        <img src={taskflowLogo} alt="TaskFlow Logo" className="w-7 h-7" />
    );
  return (
    <aside className={`bg-stone-800 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center p-4 border-b border-stone-700 h-16 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div onClick={isCollapsed ? onToggle : undefined} className={`flex items-center gap-2 text-green-400 ${isCollapsed ? 'cursor-pointer' : ''}`}>
            <Logo />
            {!isCollapsed && <h1 className="text-xl font-bold">TaskFlow</h1>}
        </div>
        <button onClick={onToggle} className={`p-2 rounded-md hover:bg-stone-700 ${isCollapsed ? 'hidden' : ''}`}>
          <ChevronsLeft size={20} />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        <button onClick={onAddListClick} className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 ${isCollapsed ? 'justify-center' : ''}`}>
          <Plus size={isCollapsed ? 20 : 16} />
          {!isCollapsed && 'Add Category'}
        </button>
        <ul className="mt-4">
            <li className="group relative">
                <a href="#" onClick={(e) => {e.preventDefault(); setSelectedListId('all')}}
                    className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors w-full ${
                    selectedListId === 'all' ? 'bg-green-900/50 text-green-300 font-semibold' : 'hover:bg-stone-700'
                    } ${isCollapsed ? 'justify-center' : ''}`}>
                    {isCollapsed ? <span className="font-bold text-lg">A</span> : <LayoutDashboard size={16} />}
                    {!isCollapsed && <span className="flex-1">All</span>}
                </a>
            </li>
          {lists.map(list => (
            <li key={list.id} className="group relative">
              <a href="#" onClick={(e) => {e.preventDefault(); setSelectedListId(list.id)}}
                className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors w-full ${
                  selectedListId === list.id ? 'bg-green-900/50 text-green-300 font-semibold' : 'hover:bg-stone-700'
                } ${isCollapsed ? 'justify-center' : ''}`}>
                {isCollapsed ? 
                    <span className="font-bold text-lg">{list.name.charAt(0).toUpperCase()}</span> : 
                    <LayoutDashboard size={16} />
                }
                {!isCollapsed && <span className="flex-1">{list.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

// Header Component
const Header = ({ user, searchTerm, setSearchTerm, filters, setFilters, onChangePasswordClick, onAddTaskClick, onLogoutRequest }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const windowWidth = useWindowWidth(); // Use the hook to get screen width
  const isMobile = windowWidth < 640; // Tailwind's 'sm' breakpoint

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  return (
    <header className="flex-shrink-0 bg-stone-800 border-b border-stone-700 h-16">
      <div className="flex items-center justify-between p-4 h-full">
        <div className="relative w-full max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm bg-stone-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-200">
                <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onAddTaskClick} 
            className={`flex items-center justify-center text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 gap-2 ${isMobile ? 'w-10 h-10' : 'px-4 py-2'}`}
            aria-label="Add Task"
          >
            <Plus size={16} />
            {!isMobile && <span>Add Task</span>}
          </button>
          <FilterPopover filters={filters} setFilters={setFilters} />
          <div className="relative" ref={profileRef}>
             <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center">
                <span className="font-bold text-green-300">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
             </button>
             {isProfileOpen && (
                <div className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-stone-800 border border-stone-700 rounded-md shadow-lg">
                    <div className="p-4 border-b border-stone-700">
                        <p className="text-sm font-semibold text-stone-200">{user?.name || 'User'}</p>
                        <p className="text-xs text-stone-400">{user?.email || 'user@example.com'}</p>
                    </div>
                    <div className="py-2">
                        <button onClick={() => { onChangePasswordClick(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Change Password</button>
                        <button onClick={() => { onLogoutRequest(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Logout</button>
                    </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Filter Popover Component
const FilterPopover = ({ filters, setFilters }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);
    const filterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filterRef]);

    useEffect(() => {
        setTempFilters(filters);
    }, [filters]);

    const handleFilterClick = (type, value) => {
        const currentValues = tempFilters[type];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setTempFilters({ ...tempFilters, [type]: newValues });
    };
    
    const clearFilters = () => {
        setTempFilters({ status: [], priority: [] });
        setFilters({ status: [], priority: [] });
        setIsOpen(false);
    };
    const applyFilters = () => { setFilters(tempFilters); setIsOpen(false); };

    const FilterButton = ({ type, value }) => (
        <button onClick={() => handleFilterClick(type, value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilters[type].includes(value) ? 'bg-green-600 text-white' : 'bg-stone-700 hover:bg-stone-600'}`}
        >{value}</button>
    );

    return (
        <div className="relative" ref={filterRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-stone-700">
                <Filter size={20} />
            </button>
            {isOpen && (
                <div className="absolute right-0 z-10 w-64 mt-2 origin-top-right bg-stone-800 border border-stone-700 rounded-md shadow-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm text-white">Filter by Status</h4>
                        <button onClick={clearFilters} className="text-xs text-green-600 hover:underline">Clear Filters</button>
                    </div>
                    <div className="flex gap-2 mb-3">
                        {['Completed', 'Pending'].map(status => <FilterButton key={status} type="status" value={status} />)}
                    </div>
                    <hr className="my-3 border-stone-600"/>
                    <h4 className="font-semibold text-sm mb-2 text-white">Filter by Priority</h4>
                    <div className="flex gap-2">
                        {['High', 'Medium', 'Low'].map(priority => <FilterButton key={priority} type="priority" value={priority} />)}
                    </div>
                    <button onClick={applyFilters} className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Apply Filters</button>
                </div>
            )}
        </div>
    );
};

// Task List Component
const TaskList = ({ tasks, lists, selectedListId, onToggleTask, onDeleteRequest, onEditRequest }) => {
  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);
  const [showCompleted, setShowCompleted] = useState(true);

  if (tasks.length === 0) {
    return (
        <div className="text-center py-8 px-4 bg-stone-800 rounded-lg">
          <h3 className="text-lg font-medium text-white">No tasks found!</h3>
          <p className="mt-1 text-sm text-stone-400">Try adjusting your filters or adding a new task.</p>
        </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {pendingTasks.map(task => (
            <TaskCard key={task.id} task={task} lists={lists} selectedListId={selectedListId} onToggleTask={onToggleTask} onDeleteRequest={onDeleteRequest} onEditRequest={onEditRequest} />
        ))}
      </div>
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-sm font-semibold text-stone-400 mb-3">
            {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Completed ({completedTasks.length})
          </button>
          {showCompleted && (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} lists={lists} selectedListId={selectedListId} onToggleTask={onToggleTask} onDeleteRequest={onDeleteRequest} onEditRequest={onEditRequest} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, lists, selectedListId, onToggleTask, onDeleteRequest, onEditRequest }) => {
  const priorityConfig = {
    High: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    Low: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  };
  const { bg, text, dot } = priorityConfig[task.priority];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const categoryName = selectedListId === 'all' ? lists.find(l => l.id === task.listId)?.name : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className={`relative flex items-center p-4 bg-stone-800 rounded-lg shadow-sm transition-opacity ${task.isCompleted ? 'opacity-60' : ''} ${isMenuOpen ? 'z-10' : 'z-0'}`}>
      <input type="checkbox" checked={task.isCompleted} onChange={() => onToggleTask(task.id)}
        className="w-5 h-5 text-green-600 bg-stone-100 border-stone-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-stone-800 focus:ring-2 dark:bg-stone-700 dark:border-stone-600"
      />
      <div className="flex-1 ml-4">
        <p className={`text-sm font-medium text-white ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-stone-400">
            {task.dueDate && (
                <div className="flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
            )}
            {categoryName && (
                <div className="flex items-center gap-1.5">
                    <LayoutDashboard size={12} />
                    <span>{categoryName}</span>
                </div>
            )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>
          <span className={`w-2 h-2 rounded-full ${dot}`}></span>
          {task.priority}
        </span>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-stone-700">
            <MoreVertical size={18} className="text-stone-500" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 z-10 w-32 mt-2 origin-top-right bg-stone-800 border border-stone-700 rounded-md shadow-lg">
              <div className="py-1">
                <button onClick={() => { onEditRequest(task); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-stone-300 hover:bg-stone-700"><Edit size={14} /> Edit</button>
                <button onClick={() => { onDeleteRequest(task); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-stone-700"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Task Modal Component
const AddTaskModal = ({ isOpen, onClose, onAdd, lists }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [listId, setListId] = useState('');
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setTitle('');
                setPriority('Medium');
                setDueDate('');
                setListId(lists[0]?.id || '');
                setErrors({});
                setIsProcessing(false);
                setApiError(null);
                setSuccess(false);
            }, 300);
        } else {
            if (lists.length > 0 && !listId) setListId(lists[0].id);
        }
    }, [isOpen, lists, listId]);

    const getTomorrowDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }

    const validate = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (!listId) newErrors.listId = 'Category is required';
        if (!dueDate) newErrors.dueDate = 'Due date is required';
        return newErrors;
    }

    const handleAdd = async () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setIsProcessing(true);
        setApiError(null);
        setSuccess(false);
        try {
            await onAdd({ title, priority, dueDate, listId });
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setApiError('Failed to add task. Please try again.');
            setIsProcessing(false);
        }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add New Task</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-700"><X size={20} /></button>
        </div>
        {success && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-md" role="alert">
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline"> Task added. This window will close shortly.</span>
            </div>
        )}
        {apiError && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {apiError}</span>
            </div>
        )}
        {!success && (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Task Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    {errors.title && <p className="text-xs mt-1 text-red-500">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
                    <select value={listId} onChange={(e) => setListId(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                        {lists.length > 0 ? lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>) : <option disabled>Create a category first</option>}
                    </select>
                    {errors.listId && <p className="text-xs mt-1 text-red-500">{errors.listId}</p>}
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-stone-300 mb-1">Due Date</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={getTomorrowDate()} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                        {errors.dueDate && <p className="text-xs mt-1 text-red-500">{errors.dueDate}</p>}
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-stone-300 mb-1">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                </div>
            </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50">Cancel</button>
          <button onClick={handleAdd} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
            {isProcessing ? 'Adding Task...' : 'Add Task'}
          </button>
        </div>
      </Modal>
    );
  };

// Edit Task Modal Component
const EditTaskModal = ({ task, lists, isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [listId, setListId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setPriority(task.priority);
            setListId(task.listId);
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        }
    }, [task]);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsProcessing(false);
                setApiError(null);
                setSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!title.trim()) {
            setApiError("Title cannot be empty.");
            return;
        }
        setIsProcessing(true);
        setApiError(null);
        setSuccess(false);
        try {
            await onSave({ ...task, title, priority, listId, dueDate });
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setApiError("Failed to save changes. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Edit Task</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-700"><X size={20} /></button>
            </div>
            {success && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-md" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Task updated. This window will close shortly.</span>
                </div>
            )}
            {apiError && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {apiError}</span>
                </div>
            )}
            {!success && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Task Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
                        <select value={listId} onChange={(e) => setListId(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                            {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-stone-300 mb-1">Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-stone-300 mb-1">Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={isProcessing} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                    {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};


// Confirm Delete Task Modal Component
const ConfirmDeleteModal = ({ task, isOpen, onClose, onConfirm }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsProcessing(false);
                setError(null);
                setSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(false);
        try {
            await onConfirm(task.id);
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setError("Failed to delete task. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
            {success && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 my-4 rounded-md" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Task deleted. This window will close shortly.</span>
                </div>
            )}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 my-4 rounded-md" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
            {!success && !error && (
                 <p className="my-4 text-sm text-stone-300">Are you sure you want to delete the task "{task?.title}"? This action cannot be undone.</p>
            )}
            <div className="flex justify-end gap-3">
                <button onClick={onClose} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50">Cancel</button>
                <button onClick={handleConfirm} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                    {isProcessing ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </Modal>
    );
};

// Confirm Delete Category Modal Component
const ConfirmDeleteCategoryModal = ({ category, isOpen, onClose, onConfirm }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsProcessing(false);
                setError(null);
                setSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(false);
        try {
            await onConfirm(category.id);
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setError("Failed to delete category. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-lg font-bold text-white">Confirm Category Deletion</h3>
            {success && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 my-4 rounded-md" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Category deleted. This window will close shortly.</span>
                </div>
            )}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 my-4 rounded-md" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
            {!success && !error && (
                <p className="my-4 text-sm text-stone-300">Are you sure you want to delete the category "<strong>{category?.name}</strong>"? All tasks within this category will also be permanently deleted.</p>
            )}
            <div className="flex justify-end gap-3">
                <button onClick={onClose} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50">Cancel</button>
                <button onClick={handleConfirm} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                    {isProcessing ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </Modal>
    );
};

// Confirm Logout Modal Component
const ConfirmLogoutModal = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-bold text-white">Confirm Logout</h3>
      <p className="my-4 text-sm text-stone-300">Are you sure you want to log out?</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
      </div>
    </Modal>
);

// Add List Modal Component
const AddListModal = ({ isOpen, onClose, onAdd }) => {
    const [listName, setListName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setListName('');
                setIsProcessing(false);
                setError(null);
                setSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!listName.trim()) {
            setError("Category name cannot be empty.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            await onAdd(listName.trim());
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setError("Could not add category. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-lg font-bold text-white mb-4">Add New Category</h3>
            {success && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-md" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Category added. This window will close shortly.</span>
                </div>
            )}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
            {!success && (
                <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Enter category name"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50">Cancel</button>
                <button onClick={handleAdd} disabled={isProcessing || success} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                    {isProcessing ? 'Adding...' : 'Add Category'}
                </button>
            </div>
        </Modal>
    );
};

// Change Password Modal Component
const ChangePasswordModal = ({ isOpen, onClose, onSave }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [strength, setStrength] = useState({ score: 0, text: '', color: '' });
    const [matchError, setMatchError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        let text = 'Very Weak'; let color = 'bg-red-500';
        if (score > 2) { text = 'Weak'; color = 'bg-orange-500'; }
        if (score > 3) { text = 'Medium'; color = 'bg-yellow-500'; }
        if (score > 4) { text = 'Strong'; color = 'bg-green-500'; }
        setStrength({ score, text, color });
    };

    // Effect to reset state when the modal is closed
    useEffect(() => {
        if (!isOpen) {
            // Delay reset to prevent content flashing before modal disappears
            setTimeout(() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setStrength({ score: 0, text: '', color: '' });
                setMatchError('');
                setIsSaving(false);
                setSaveError(null);
                setSaveSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (newPassword) checkPasswordStrength(newPassword);
        else setStrength({ score: 0, text: '', color: '' });
        if (confirmPassword && newPassword !== confirmPassword) setMatchError('Passwords do not match');
        else setMatchError('');
    }, [newPassword, confirmPassword]);

    const handleSave = async () => {
        if (matchError || !newPassword || !oldPassword) return;

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            await onSave({ oldPassword, newPassword });
            setSaveSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000); // Close modal 2 seconds after success
        } catch (error) {
            setSaveError("Failed to update password. Please check your current password and try again.");
            setIsSaving(false); // Re-enable form on error
        }
        // On success, isSaving remains true to keep form disabled until close
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
            
            {saveSuccess && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-md relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Your password has been updated. This window will close shortly.</span>
                </div>
            )}
            
            {saveError && (
                 <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {saveError}</span>
                </div>
            )}

            {!saveSuccess && (
                <div className="space-y-4">
                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current Password" disabled={isSaving} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    <div>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" disabled={isSaving} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                        {newPassword && (
                            <div className="mt-2">
                                <div className="h-2 w-full bg-stone-600 rounded-full">
                                    <div className={`h-2 rounded-full ${strength.color}`} style={{ width: `${strength.score * 20}%` }}></div>
                                </div>
                                <p className="text-xs mt-1 text-stone-400">{strength.text}</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" disabled={isSaving} className={`w-full px-3 py-2 text-sm bg-stone-700 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${matchError ? 'border-red-500 focus:ring-red-500' : 'border-stone-600 focus:ring-green-500'}`} />
                        {matchError && <p className="text-xs mt-1 text-red-500">{matchError}</p>}
                    </div>
                </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500 disabled:opacity-50" disabled={isSaving || saveSuccess}>Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50" disabled={!!matchError || !newPassword || !oldPassword || isSaving || saveSuccess}>
                    {isSaving ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </Modal>
    );
};