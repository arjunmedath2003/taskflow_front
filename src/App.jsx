import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, LayoutDashboard, Trash2, Edit, Calendar as CalendarIcon, ChevronsLeft, X, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import taskflowLogo from './assets/taskflow.svg';
import "./App.css"

// Mock Data
const initialLists = [
  { id: 'l1', name: 'Work' },
  { id: 'l2', name: 'Personal' },
  { id: 'l3', name: 'Shopping' },
];

const initialTasks = [
  { id: 't1', listId: 'l1', title: 'Finish Q2 financial report', priority: 'High', dueDate: '2025-08-25', isCompleted: false },
  { id: 't2', listId: 'l1', title: 'Schedule team meeting', priority: 'Medium', dueDate: '2025-08-22', isCompleted: false },
  { id: 't3', listId: 'l1', title: 'Review project proposal', priority: 'Low', dueDate: '2025-08-30', isCompleted: true },
  { id: 't4', listId: 'l2', title: 'Call the dentist', priority: 'High', dueDate: '2025-08-20', isCompleted: false },
  { id: 't5', listId: 'l2', title: 'Pay electricity bill', priority: 'Medium', dueDate: '2025-08-21', isCompleted: false },
  { id: 't6', listId: 'l3', title: 'Buy milk and eggs', priority: 'Low', dueDate: '2025-08-19', isCompleted: true },
  { id: 't7', listId: 'l3', title: 'Get a birthday gift for Sarah', priority: 'High', dueDate: '2025-08-28', isCompleted: false },
];

// Priority Colors Config
const priorityConfig = {
  High: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  Low: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
};

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


// Main App Component
export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [lists, setLists] = useState(initialLists);
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

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

  const handleAddTask = (taskData) => {
    const newTask = { id: `t${Date.now()}`, isCompleted: false, ...taskData };
    setTasks(prevTasks => [...prevTasks, newTask]);
    setIsAddTaskModalOpen(false);
  };
  
  const handleToggleTask = (taskId) => setTasks(tasks.map(task => task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task));
  const handleDeleteTask = (taskId) => { setTasks(tasks.filter(task => task.id !== taskId)); setTaskToDelete(null); };
  const handleUpdateTask = (updatedTask) => { setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task)); setTaskToEdit(null); };
  const handleAddList = (listName) => { const newList = { id: `l${Date.now()}`, name: listName }; setLists(prevLists => [...prevLists, newList]); setIsAddListModalOpen(false); };
  const handleDeleteCategory = (listId) => {
    const remainingLists = lists.filter(list => list.id !== listId);
    setLists(remainingLists);
    setTasks(prevTasks => prevTasks.filter(task => task.listId !== listId));
    if (selectedListId === listId) setSelectedListId('all');
    setCategoryToDelete(null);
  };
  const handleLogout = () => {
      console.log("User logged out.");
      setIsLogoutModalOpen(false);
      // Here you would typically clear user session, tokens, etc.
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
          onDeleteCategoryRequest={setCategoryToDelete}
        />

        <div className="flex-1 flex flex-col h-screen">
          <Header 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
            onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
            onAddTaskClick={() => setIsAddTaskModalOpen(true)}
            onLogoutRequest={() => setIsLogoutModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              {selectedListId === 'all' ? 'All Tasks' : selectedList?.name || 'Tasks'}
            </h1>
            <TaskList 
              tasks={filteredTasks} lists={lists} selectedListId={selectedListId}
              onToggleTask={handleToggleTask} onDeleteRequest={setTaskToDelete} onEditRequest={setTaskToEdit}
            />
          </main>
        </div>
        
        <EditTaskModal task={taskToEdit} lists={lists} isOpen={!!taskToEdit} onClose={() => setTaskToEdit(null)} onSave={handleUpdateTask} />
        <ConfirmDeleteModal task={taskToDelete} isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={handleDeleteTask} />
        <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} onAdd={handleAddTask} lists={lists} />
        <AddListModal isOpen={isAddListModalOpen} onClose={() => setIsAddListModalOpen(false)} onAdd={handleAddList} />
        <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} />
        <ConfirmDeleteCategoryModal category={categoryToDelete} isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={handleDeleteCategory} />
        <ConfirmLogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogout} />
      </div>
    </div>
  );
}

// Sidebar Component
const Sidebar = ({ lists, selectedListId, setSelectedListId, isCollapsed, onToggle, onAddListClick, onDeleteCategoryRequest }) => {
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
              {!isCollapsed && (
                  <button onClick={() => onDeleteCategoryRequest(list)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                  </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

// Header Component
const Header = ({ searchTerm, setSearchTerm, filters, setFilters, onChangePasswordClick, onAddTaskClick, onLogoutRequest }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

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
          <button onClick={onAddTaskClick} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2">
            <Plus size={16} /> Add Task
          </button>
          <FilterPopover filters={filters} setFilters={setFilters} />
          <div className="relative" ref={profileRef}>
             <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center">
                <span className="font-bold text-green-300">A</span>
             </button>
             {isProfileOpen && (
                <div className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-stone-800 border border-stone-700 rounded-md shadow-lg">
                    <div className="p-4 border-b border-stone-700">
                        <p className="text-sm font-semibold text-stone-200">Admin</p>
                        <p className="text-xs text-stone-400">admin@taskflow.com</p>
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
    <div className={`flex items-center p-4 bg-stone-800 rounded-lg shadow-sm transition-opacity ${task.isCompleted ? 'opacity-60' : ''}`}>
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
    const [listId, setListId] = useState(lists[0]?.id || '');
    const [errors, setErrors] = useState({});

    useEffect(() => { if (lists.length > 0 && !listId) setListId(lists[0].id); }, [lists, listId]);

    const getTomorrowDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }

    const validate = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'required';
        if (!listId) newErrors.listId = 'required';
        if (!dueDate) newErrors.dueDate = 'required';
        return newErrors;
    }

    const handleAdd = () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onAdd({ title, priority, dueDate, listId });
        setTitle(''); setPriority('Medium'); setDueDate(''); setErrors({});
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add New Task</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-700"><X size={20} /></button>
        </div>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Task Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                {errors.title && <p className="text-xs mt-1 text-red-500">{errors.title}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
                <select value={listId} onChange={(e) => setListId(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    {lists.length > 0 ? lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>) : <option disabled>Create a category first</option>}
                </select>
                {errors.listId && <p className="text-xs mt-1 text-red-500">{errors.listId}</p>}
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-stone-300 mb-1">Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={getTomorrowDate()} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                    {errors.dueDate && <p className="text-xs mt-1 text-red-500">{errors.dueDate}</p>}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-stone-300 mb-1">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option>Low</option><option>Medium</option><option>High</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
          <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Task</button>
        </div>
      </Modal>
    );
  };

// Edit Task Modal Component
const EditTaskModal = ({ task, lists, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [listId, setListId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setListId(task.listId);
    }
  }, [task]);

  const handleSave = () => onSave({ ...task, title, priority, listId });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Edit Task</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-700"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Task Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
          <select value={listId} onChange={(e) => setListId(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Save Changes</button>
      </div>
    </Modal>
  );
};

// Confirm Delete Task Modal Component
const ConfirmDeleteModal = ({ task, isOpen, onClose, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
    <p className="my-4 text-sm text-stone-300">Are you sure you want to delete the task "{task?.title}"? This action cannot be undone.</p>
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
      <button onClick={() => onConfirm(task.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
    </div>
  </Modal>
);

// Confirm Delete Category Modal Component
const ConfirmDeleteCategoryModal = ({ category, isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-bold text-white">Confirm Category Deletion</h3>
      <p className="my-4 text-sm text-stone-300">Are you sure you want to delete the category "<strong>{category?.name}</strong>"? All tasks within this category will also be permanently deleted.</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
        <button onClick={() => onConfirm(category.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
      </div>
    </Modal>
);

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
  const handleAdd = () => { if (listName.trim()) { onAdd(listName.trim()); setListName(''); } };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-bold text-white mb-4">Add New Category</h3>
      <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Enter category name" className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
        <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Category</button>
      </div>
    </Modal>
  );
};

// Change Password Modal Component
const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [strength, setStrength] = useState({ score: 0, text: '', color: '' });
    const [matchError, setMatchError] = useState('');

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

    useEffect(() => {
        if (newPassword) checkPasswordStrength(newPassword);
        else setStrength({ score: 0, text: '', color: '' });
        if (confirmPassword && newPassword !== confirmPassword) setMatchError('Passwords do not match');
        else setMatchError('');
    }, [newPassword, confirmPassword]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
            <div className="space-y-4">
                <input type="password" placeholder="Current Password" className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-3 py-2 text-sm bg-stone-700 border border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
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
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className={`w-full px-3 py-2 text-sm bg-stone-700 border rounded-md focus:outline-none focus:ring-2 ${matchError ? 'border-red-500 focus:ring-red-500' : 'border-stone-600 focus:ring-green-500'}`} />
                    {matchError && <p className="text-xs mt-1 text-red-500">{matchError}</p>}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-200 bg-stone-600 rounded-md hover:bg-stone-500">Cancel</button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50" disabled={!!matchError || !newPassword}>Update Password</button>
            </div>
        </Modal>
    );
};
