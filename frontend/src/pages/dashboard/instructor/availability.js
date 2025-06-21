// pages/dashboard/instructor/availability.js
import { useEffect, useState, Fragment } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { Dialog } from '@headlessui/react';
import useAuthStore from '@/store/auth/authStore';
import {
  toggleInstructorStatus,
  getInstructorAvailability,
  updateInstructorAvailability,
} from '@/services/instructor/instructorService';
import { toast } from 'react-toastify';

export default function InstructorAvailabilityPage() {
  const [availability, setAvailability] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Available');
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [available, setAvailable] = useState(user?.is_online ?? false);

  useEffect(() => {
    setAvailable(user?.is_online ?? false);
  }, [user]);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await getInstructorAvailability();
        if (Array.isArray(res.availability)) {
          setAvailability(res.availability);
        }
      } catch (err) {
        console.error('Failed to load availability', err);
      }
    }
    fetchAvailability();
  }, []);

  const categoryColors = {
    'Office Hour': '#34d399',
    'Q&A': '#60a5fa',
    'Consultation': '#fbbf24',
    'Available': '#a78bfa'
  };

  const isOverlapping = (newSlot) => {
    return availability.some((slot) => {
      return (
        newSlot.daysOfWeek?.toString() === slot.daysOfWeek?.toString() &&
        (new Date(`1970-01-01T${newSlot.startTime}`) < new Date(`1970-01-01T${slot.endTime}`) &&
         new Date(`1970-01-01T${newSlot.endTime}`) > new Date(`1970-01-01T${slot.startTime}`))
      );
    });
  };

  const handleSlotSelect = (selectionInfo) => {
    setSelectedSlot(selectionInfo);
    setIsModalOpen(true);
  };

  const confirmAddSlot = () => {
    const title = selectedCategory;
    const color = categoryColors[title] || '#a78bfa';

    const startDate = new Date(selectedSlot.start);
    const endDate = new Date(selectedSlot.end);

    const newSlot = {
      id: uuidv4(),
      title,
      startTime: startDate.toTimeString().split(' ')[0],
      endTime: endDate.toTimeString().split(' ')[0],
      daysOfWeek: [startDate.getDay()],
      startRecur: selectedSlot.startStr.split('T')[0],
      backgroundColor: color,
      borderColor: color,
    };

    if (isOverlapping(newSlot)) {
      alert('This time slot overlaps with an existing one.');
      return;
    }

    setAvailability((prev) => [...prev, newSlot]);
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleSlotRemove = (clickInfo) => {
    if (confirm('Remove this availability slot?')) {
      setAvailability((prev) =>
        prev.filter((slot) => String(slot.id) !== String(clickInfo.event.id))
      );
    }
  };

  return (
    <InstructorLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Set Your Availability</h1>
        <div className="mb-6">
          <button
            onClick={async () => {
              const newStatus = !available;
              try {
                await toggleInstructorStatus(newStatus);
                setAvailable(newStatus);
                setUser({ ...user, is_online: newStatus });
                toast.success(newStatus ? 'You are now available' : 'You are now unavailable');
              } catch (err) {
                toast.error('Failed to update availability');
              }
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${available ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {available ? 'Available' : 'Unavailable'}
          </button>
        </div>

        <div className="bg-white border rounded-xl shadow p-4">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable={true}
            select={handleSlotSelect}
            events={availability}
            eventClick={handleSlotRemove}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
          />
        </div>
        <div className="mt-4">
          <button
            onClick={async () => {
              try {
                await updateInstructorAvailability(availability);
                toast.success('Availability saved');
              } catch (err) {
                toast.error('Failed to save availability');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Availability
          </button>
        </div>

        {/* Legend */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Legend</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(categoryColors).map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for selecting category */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} as={Fragment}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-lg font-bold mb-4">Select Availability Category</Dialog.Title>
              <select
                className="w-full p-2 border rounded mb-4"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {Object.keys(categoryColors).map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button onClick={confirmAddSlot} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </section>
    </InstructorLayout>
  );
}