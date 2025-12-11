import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './EmployeeSchedule.css';

const DEFAULT_EMPLOYEES = [
    { id: '1', name: 'Benz', role: 'Manager' },
    { id: '2', name: 'Moowan', role: 'Owner' },
    { id: '3', name: 'Anna', role: 'Staff' },
    { id: '4', name: 'Mom', role: 'Staff' }
];

export default function EmployeeSchedule() {
    const { t, i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState({}); // { "YYYY-MM-DD": [{empId, empName, id}] }
    const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
    const [draggedEmployee, setDraggedEmployee] = useState(null);

    // Modal State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffFormName, setStaffFormName] = useState('');
    const [staffFormRole, setStaffFormRole] = useState('');

    // Load Data on Mount
    useEffect(() => {
        const savedSchedules = localStorage.getItem('nekoha_employee_schedules');
        if (savedSchedules) {
            try { setSchedules(JSON.parse(savedSchedules)); } catch (e) { console.error(e); }
        }

        const savedEmployees = localStorage.getItem('nekoha_employees');
        if (savedEmployees) {
            try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { console.error(e); }
        }
    }, []);

    // Save Data on Change
    useEffect(() => {
        localStorage.setItem('nekoha_employee_schedules', JSON.stringify(schedules));
    }, [schedules]);

    useEffect(() => {
        localStorage.setItem('nekoha_employees', JSON.stringify(employees));
    }, [employees]);


    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US', { month: 'long' });

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => setCurrentDate(new Date());


    // --- Drag & Drop Handlers ---
    const handleDragStart = (e, employee) => {
        setDraggedEmployee(employee);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(employee)); // Helper for other apps potentially
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('droppable-hover');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('droppable-hover');
    };

    const handleDrop = (e, dateStr) => {
        e.preventDefault();
        e.currentTarget.classList.remove('droppable-hover');
        if (!draggedEmployee) return;

        setSchedules(prev => {
            const currentDaySchedules = prev[dateStr] || [];
            if (currentDaySchedules.find(s => s.empId === draggedEmployee.id)) return prev; // Prevent dupes

            const newEntry = {
                id: Date.now().toString(),
                empId: draggedEmployee.id,
                name: draggedEmployee.name,
                role: draggedEmployee.role
            };
            return { ...prev, [dateStr]: [...currentDaySchedules, newEntry] };
        });
        setDraggedEmployee(null);
    };

    const handleRemoveSchedule = (dateStr, scheduleId) => {
        setSchedules(prev => {
            const currentDaySchedules = prev[dateStr] || [];
            const newDaySchedules = currentDaySchedules.filter(item => item.id !== scheduleId);
            if (newDaySchedules.length === 0) {
                const { [dateStr]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [dateStr]: newDaySchedules };
        });
    };


    // --- Staff CRUD Handlers ---
    const openAddStaffModal = () => {
        setEditingStaff(null);
        setStaffFormName('');
        setStaffFormRole('');
        setIsStaffModalOpen(true);
    };

    const openEditStaffModal = (emp) => {
        setEditingStaff(emp);
        setStaffFormName(emp.name);
        setStaffFormRole(emp.role);
        setIsStaffModalOpen(true);
    };

    const handleDeleteStaff = (empId) => {
        if (!window.confirm(t('Are you sure you want to delete this staff member?', 'Are you sure you want to delete this staff member?'))) return;
        setEmployees(prev => prev.filter(e => e.id !== empId));
    };

    const handleSaveStaff = (e) => {
        e.preventDefault();
        if (!staffFormName.trim()) return;

        if (editingStaff) {
            // Update
            setEmployees(prev => prev.map(emp =>
                emp.id === editingStaff.id
                    ? { ...emp, name: staffFormName, role: staffFormRole }
                    : emp
            ));
        } else {
            // Add
            const newStaff = {
                id: Date.now().toString(),
                name: staffFormName,
                role: staffFormRole || 'Staff'
            };
            setEmployees(prev => [...prev, newStaff]);
        }
        setIsStaffModalOpen(false);
    };


    // --- Render Helpers ---
    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`prev-${i}`} className="schedule-day-cell other-month"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === date.toDateString();
            const daySchedules = schedules[dateStr] || [];

            days.push(
                <div
                    key={dateStr}
                    className={`schedule-day-cell ${isToday ? 'today' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                >
                    <span className="day-number">{day}</span>
                    {daySchedules.map(sch => (
                        <div key={sch.id} className="scheduled-employee">
                            <span>{sch.name}</span>
                            <button
                                className="remove-employee-btn"
                                onClick={(e) => { e.stopPropagation(); handleRemoveSchedule(dateStr, sch.id); }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        const remainingCells = totalSlots - days.length;
        for (let i = 0; i < remainingCells; i++) {
            days.push(<div key={`next-${i}`} className="schedule-day-cell other-month"></div>);
        }
        return days;
    };

    return (
        <div className="employee-schedule-container">
            {/* Top Bar: Staff List */}
            <div className="schedule-sidebar">
                <div className="schedule-sidebar-header">
                    <h3>{t('Staff List', 'Staff List')}</h3>
                    <button className="btn btn-primary btn-sm btn-add-staff" onClick={openAddStaffModal}>
                        <span>+</span> {t('Add Member', 'Add Member')}
                    </button>
                </div>

                <div className="staff-list-container">
                    {employees.map(emp => (
                        <div
                            key={emp.id}
                            className="employee-draggable"
                            draggable
                            onDragStart={(e) => handleDragStart(e, emp)}
                        >
                            <div className="employee-avatar">{emp.name[0]?.toUpperCase()}</div>
                            <div className="employee-info">
                                <div>{emp.name}</div>
                                <div className="employee-role">{emp.role}</div>
                            </div>
                            <div className="employee-actions">
                                <button className="action-btn-mini" onClick={() => openEditStaffModal(emp)} title="Edit">✎</button>
                                <button className="action-btn-mini" onClick={() => handleDeleteStaff(emp.id)} title="Delete" style={{ color: 'var(--danger)' }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="schedule-calendar-area">
                <div className="schedule-header">
                    <h2>{monthName} {year}</h2>
                    <div className="schedule-controls">
                        <button className="btn btn-outline btn-sm" onClick={handlePrevMonth}>←</button>
                        <button className="btn btn-outline btn-sm" onClick={handleToday}>{t('Today', 'Today')}</button>
                        <button className="btn btn-outline btn-sm" onClick={handleNextMonth}>→</button>
                    </div>
                </div>

                <div className="schedule-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="schedule-day-header">{d}</div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Add/Edit Staff Modal */}
            {isStaffModalOpen && createPortal(
                <div className="modal active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingStaff ? t('Edit Staff', 'Edit Staff') : t('Add New Staff', 'Add New Staff')}</h2>
                            <button className="modal-close" onClick={() => setIsStaffModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveStaff}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('Name', 'Name')}</label>
                                    <input
                                        type="text"
                                        value={staffFormName}
                                        onChange={e => setStaffFormName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('Role', 'Role')}</label>
                                    <input
                                        type="text"
                                        value={staffFormRole}
                                        onChange={e => setStaffFormRole(e.target.value)}
                                        placeholder="e.g. Staff, Cleaner"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsStaffModalOpen(false)}>{t('Cancel', 'Cancel')}</button>
                                <button type="submit" className="btn btn-primary">{t('Save', 'Save')}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
