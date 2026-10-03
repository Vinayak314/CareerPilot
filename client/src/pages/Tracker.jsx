import { useState, useMemo } from 'react';
import { Plus, GripVertical, Building2, Calendar } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useApi from '../hooks/useApi';
import { applicationsApi } from '../api/endpoints';
import { toast } from '../store/toastStore';
import { PageHeader, LoadingState, ErrorState } from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, TextArea, SelectField } from '../components/ui/FormField';
import { getErrorMessage } from '../lib/errors';

const COLUMNS = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

const Tracker = () => {
  const { data: applicationData, loading, error, reload, setData } = useApi(applicationsApi.list, []);
  const rawApps = Array.isArray(applicationData) ? applicationData : [];
  const [activeId, setActiveId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Group applications by status
  const appsByStatus = useMemo(() => {
    const grouped = COLUMNS.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
    rawApps.forEach(app => {
      const status = COLUMNS.includes(app.status) ? app.status : 'Saved';
      grouped[status].push(app);
    });
    return grouped;
  }, [rawApps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeApp = rawApps.find(a => a._id === activeId);
    if (!activeApp) return;

    const overApp = rawApps.find(a => a._id === overId);
    const overStatus = overApp ? overApp.status : overId;

    if (activeApp.status !== overStatus && COLUMNS.includes(overStatus)) {
      setData(prev => prev.map(a => a._id === activeId ? { ...a, status: overStatus } : a));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeId = active.id;
    const app = rawApps.find(a => a._id === activeId);
    if (!app) return;
    
    const previousStatus = app.status;
    const newStatus = COLUMNS.includes(over.id) ? over.id : rawApps.find(a => a._id === over.id)?.status;
    
    if (newStatus && previousStatus !== newStatus) {
      try {
        await applicationsApi.update(activeId, { status: newStatus });
        toast.success(`Moved to ${newStatus}`);
      } catch (err) {
        toast.error('Failed to update status');
        setData(prev => prev.map(a => a._id === activeId ? { ...a, status: previousStatus } : a));
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Loading tracker..." />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load applications"
        message={error.response?.status === 404
          ? 'The applications API endpoint is not available on the server yet.'
          : getErrorMessage(error)}
        onRetry={reload}
      />
    );
  }

  const activeApp = activeId ? rawApps.find(a => a._id === activeId) : null;

  return (
    <div className="h-full flex flex-col animate-[fadeIn_300ms_ease-out]">
      <PageHeader 
        title="Application Tracker" 
        actions={
          <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add Job</Button>
        }
      />

      <div className="flex gap-6 overflow-x-auto pb-6 flex-1 min-h-[500px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map(col => (
            <Column key={col} title={col} items={appsByStatus[col]} />
          ))}

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeApp ? <AppCard app={activeApp} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      <AddJobModal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdded={(newApp) => setData(prev => [...prev, newApp])} 
      />
    </div>
  );
};

const AddJobModal = ({ open, onClose, onAdded }) => {
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    const payload = {
      company: fd.get('company'),
      jobTitle: fd.get('jobTitle'),
      status: fd.get('status'),
      location: fd.get('location') || undefined,
      matchScore: fd.get('matchScore') ? Number(fd.get('matchScore')) : undefined,
      jobUrl: fd.get('jobUrl') || undefined,
      notes: fd.get('notes') || undefined,
      appliedAt: fd.get('appliedAt') || undefined
    };

    try {
      const created = await applicationsApi.create(payload);
      onAdded(created);
      toast.success('Job added to tracker');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to add job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Custom Job Tracking Card" size="md">
      <form id="add-job-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="company" name="company" label="Company" required placeholder="e.g. Acme Corp" />
          <TextField id="jobTitle" name="jobTitle" label="Job Title" required placeholder="e.g. Frontend Engineer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="status" name="status" label="Status" required defaultValue="Saved">
            {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <TextField id="matchScore" name="matchScore" type="number" min="0" max="100" label="Fit Score (%)" placeholder="e.g. 85" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="location" name="location" label="Location (Optional)" placeholder="e.g. Remote" />
          <TextField id="appliedAt" name="appliedAt" type="date" label="Application Date (Optional)" />
        </div>
        <TextField id="jobUrl" name="jobUrl" type="url" label="Job URL (Optional)" placeholder="https://..." />
        <TextArea id="notes" name="notes" label="Notes / Reminders (Optional)" rows={3} placeholder="Add any details, contacts, or reminders here." />
        
        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Application</Button>
        </div>
      </form>
    </Modal>
  );
};

const Column = ({ title, items }) => {
  return (
    <div className="w-80 flex-shrink-0 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col h-full max-h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100/50 rounded-t-xl">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        <SortableContext id={title} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(app => (
            <SortableAppCard key={app._id} app={app} />
          ))}
          {items.length === 0 && (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-400">
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

const SortableAppCard = ({ app }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AppCard app={app} />
    </div>
  );
};

const AppCard = ({ app, isOverlay }) => {
  const matchColor = app.matchScore >= 80 ? 'text-emerald-700 bg-emerald-50' : 
                     app.matchScore >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

  return (
    <div className={`bg-white border ${isOverlay ? 'border-teal-500 shadow-xl scale-105' : 'border-slate-200 shadow-sm'} rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-slate-300 transition-colors group relative`}>
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      <div className="pr-6">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h4 className="font-bold text-slate-900 text-sm leading-tight break-words">{app.jobTitle}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{app.company}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-50">
          {app.matchScore ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${matchColor}`}>
              {app.matchScore}% Match
            </span>
          ) : null}
          <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold ml-auto">
            <Calendar className="w-3 h-3" />
            {new Date(app.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracker;
