'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { Plus, Edit, Trash2, X, Ticket, Zap } from 'lucide-react';

interface TicketTier {
    type: string;
    price: string;
    stock: string;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        location: '',
        description: '',
        image: '',
    });
    const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
        { type: 'Regular', price: '', stock: '100' }
    ]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    // Manage Tickets modal state
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [newTicket, setNewTicket] = useState({ type: '', price: '', stock: '', status: 'ACTIVE' });
    const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/admin/events');
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Create/Edit Event ---
    const resetForm = () => {
        setFormData({ name: '', date: '', location: '', description: '', image: '' });
        setTicketTiers([{ type: 'Regular', price: '', stock: '100' }]);
        setImageFile(null);
        setError('');
        setEditingEventId(null);
    };

    const handleEdit = (event: any) => {
        setEditingEventId(event.id);
        // Format date for datetime-local input
        const date = new Date(event.date);
        const formattedDate = date.toISOString().slice(0, 16);

        setFormData({
            name: event.name,
            date: formattedDate,
            location: event.location,
            description: event.description || '',
            image: event.image || '',
        });
        // Note: For event edit, we might not want to edit tickets in the same modal 
        // because of the complexity of merging. The user can use "Manage Tickets" for that.
        // But for consistency with the "Create" flow, we'll hide the ticket section when editing
        setIsModalOpen(true);
    };

    const addTicketTier = () => {
        setTicketTiers([...ticketTiers, { type: '', price: '', stock: '50' }]);
    };

    const removeTicketTier = (index: number) => {
        if (ticketTiers.length <= 1) return;
        setTicketTiers(ticketTiers.filter((_, i) => i !== index));
    };

    const updateTicketTier = (index: number, field: keyof TicketTier, value: string) => {
        const updated = [...ticketTiers];
        updated[index] = { ...updated[index], [field]: value };
        setTicketTiers(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setUploading(true);

        if (!editingEventId) {
            // Validate ticket tiers only for CREATE
            for (const tier of ticketTiers) {
                if (!tier.type.trim()) {
                    setError('Each ticket tier must have a type name');
                    setUploading(false);
                    return;
                }
                if (!tier.price || parseFloat(tier.price) < 0) {
                    setError(`Invalid price for tier "${tier.type}"`);
                    setUploading(false);
                    return;
                }
                if (!tier.stock || parseInt(tier.stock) < 0) {
                    setError(`Invalid stock for tier "${tier.type}"`);
                    setUploading(false);
                    return;
                }
            }
        }

        try {
            let imageUrl = formData.image;

            // Handle image upload
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            const url = editingEventId
                ? `/api/admin/events/${editingEventId}`
                : '/api/admin/events';
            const method = editingEventId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    image: imageUrl,
                    ...(editingEventId ? {} : { tickets: ticketTiers }),
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchEvents();
            } else {
                const errorData = await res.json();
                setError(errorData.error || `Failed to ${editingEventId ? 'update' : 'create'} event`);
            }
        } catch (err: any) {
            console.error(`Error ${editingEventId ? 'updating' : 'creating'} event:`, err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // --- Manage Tickets ---
    const fetchTickets = async (eventId: string) => {
        try {
            const res = await fetch(`/api/admin/tickets?eventId=${eventId}`);
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const handleAddOrUpdateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/tickets';
            const method = editingTicketId ? 'PUT' : 'POST';
            const body = editingTicketId
                ? { id: editingTicketId, ...newTicket }
                : { eventId: selectedEvent.id, ...newTicket };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setNewTicket({ type: '', price: '', stock: '', status: 'ACTIVE' });
                setEditingTicketId(null);
                fetchTickets(selectedEvent.id);
                fetchEvents(); // refresh table counts
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${editingTicketId ? 'update' : 'add'} ticket`);
            }
        } catch (error) {
            console.error(`Error ${editingTicketId ? 'updating' : 'adding'} ticket:`, error);
        }
    };

    const handleEditTicket = (ticket: any) => {
        setEditingTicketId(ticket.id);
        setNewTicket({
            type: ticket.type,
            price: ticket.price.toString(),
            stock: ticket.stock.toString(),
            status: ticket.status || 'ACTIVE'
        });
    };

    const handleDeleteTicket = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket tier?')) return;
        try {
            const res = await fetch(`/api/admin/tickets?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTickets(selectedEvent.id);
                fetchEvents();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event? This will also delete all associated tickets, purchases, and bazar registrations.')) return;
        try {
            const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchEvents();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete event. It might have active dependencies.');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('An unexpected error occurred while deleting the event.');
        }
    };

    if (loading) return <div className={styles.loading}>Loading Events...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Acara & Tiket</h1>
                    <p>Buat dan kelola acara serta kategori tiket Anda.</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus size={18} /> BUAT ACARA BARU
                </button>
            </div>

            {/* Events Table */}
            <div className={styles.tableContainer} style={{ marginTop: '3rem' }}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nama Acara</th>
                            <th className={styles.th}>Tanggal</th>
                            <th className={styles.th}>Lokasi</th>
                            <th className={styles.th}>Harga Mulai</th>
                            <th className={styles.th}>Tiket / Bazar</th>
                            <th className={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    Belum ada acara. Buat acara pertama Anda di atas.
                                </td>
                            </tr>
                        )}
                        {events.map((event) => (
                            <tr key={event.id}>
                                <td className={styles.td}>{event.name}</td>
                                <td className={styles.td}>{new Date(event.date).toLocaleDateString()}</td>
                                <td className={styles.td}>{event.location}</td>
                                <td className={styles.td}>
                                    {event.tickets?.[0] ? `Rp ${event.tickets[0].price.toLocaleString()}` : 'Tidak ada Tiket'}
                                </td>
                                <td className={styles.td}>{event._count?.tickets} / {event._count?.bazars}</td>
                                <td className={styles.td}>
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                fetchTickets(event.id);
                                                setIsTicketsModalOpen(true);
                                                setEditingTicketId(null);
                                                setNewTicket({ type: '', price: '', stock: '', status: 'ACTIVE' });
                                            }}
                                            title="Manage Tickets"
                                        >
                                            <Ticket size={16} />
                                        </button>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => handleEdit(event)}
                                            title="Edit Event"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button className={styles.iconBtn} onClick={() => handleDelete(event.id)} title="Delete Event"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ========== CREATE/EDIT EVENT MODAL ========== */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingEventId ? 'Edit Acara' : 'Buat Acara Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>

                        {error && (
                            <div className={styles.errorBanner}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            {/* Event Details */}
                            <input
                                type="text"
                                placeholder="Nama Acara"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                            />
                            <input
                                type="datetime-local"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={styles.input}
                            />
                            <input
                                type="text"
                                placeholder="Lokasi"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className={styles.input}
                            />
                            <textarea
                                placeholder="Deskripsi"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={styles.textarea}
                            />
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Event Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                    className={styles.input}
                                />
                                {imageFile && <p className={styles.fileHint}>Selected: {imageFile.name}</p>}
                                {editingEventId && formData.image && !imageFile && (
                                    <p className={styles.fileHint}>Current image exists</p>
                                )}
                            </div>

                            {/* Ticket Tiers Section - Only for CREATE */}
                            {!editingEventId && (
                                <div className={styles.tierSection}>
                                    <div className={styles.tierHeader}>
                                        <h3><Ticket size={16} /> Kategori Tiket Awal</h3>
                                        <button type="button" onClick={addTicketTier} className={styles.addTierBtn}>
                                            <Plus size={14} /> Tambah Kategori
                                        </button>
                                    </div>

                                    <div className={styles.tierList}>
                                        {ticketTiers.map((tier, index) => (
                                            <div key={index} className={styles.tierRow}>
                                                <input
                                                    type="text"
                                                    placeholder="Tipe"
                                                    required
                                                    value={tier.type}
                                                    onChange={(e) => updateTicketTier(index, 'type', e.target.value)}
                                                    className={styles.input}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Harga"
                                                    required
                                                    min="0"
                                                    value={tier.price}
                                                    onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                                                    className={styles.input}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Stok"
                                                    required
                                                    min="0"
                                                    value={tier.stock}
                                                    onChange={(e) => updateTicketTier(index, 'stock', e.target.value)}
                                                    className={styles.input}
                                                />
                                                {ticketTiers.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTicketTier(index)}
                                                        className={styles.removeTierBtn}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={uploading} className="btn-primary">
                                {uploading
                                    ? (editingEventId ? 'Memperbarui...' : 'Membuat...')
                                    : (editingEventId ? 'Simpan Perubahan' : 'Buat Acara')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MANAGE TICKETS MODAL ========== */}
            {isTicketsModalOpen && selectedEvent && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2>Kelola Tiket: {selectedEvent.name}</h2>
                            <button onClick={() => setIsTicketsModalOpen(false)}><X size={24} /></button>
                        </div>

                        <div className={styles.tableOverlapContainer}>
                            {tickets.length === 0 ? (
                                <div className={styles.emptyTickets}>
                                    <Ticket size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p>Belum ada kategori tiket untuk acara ini.</p>
                                </div>
                            ) : (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.manageTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.th}>Kategori</th>
                                                <th className={styles.th}>Harga</th>
                                                <th className={styles.th}>Stok</th>
                                                <th className={styles.th}>Status</th>
                                                <th className={styles.th} style={{ textAlign: 'right' }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.map((ticket) => (
                                                <tr key={ticket.id} className={styles.manageTableRow}>
                                                    <td className={styles.td}>
                                                        <div className={styles.tierNameMain}>{ticket.type}</div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.priceTag}>Rp {ticket.price.toLocaleString()}</span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.stockCount}>
                                                            <Zap size={10} style={{ color: 'var(--primary)' }} />
                                                            {ticket.stock}
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={`${styles.statusBadge} ${ticket.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed}`}>
                                                            {ticket.status}
                                                        </span>
                                                    </td>
                                                    <td className={styles.td} style={{ textAlign: 'right' }}>
                                                        <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                                            <button
                                                                className={styles.iconBtn}
                                                                onClick={() => handleEditTicket(ticket)}
                                                                title="Edit Tier"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                className={styles.iconBtn}
                                                                onClick={() => handleDeleteTicket(ticket.id)}
                                                                style={{ color: '#ff4444' }}
                                                                title="Delete Tier"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={styles.ticketManageForm}>
                            <h3 style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem', fontSize: '1rem' }}>
                                {editingTicketId ? 'Edit Kategori Tiket' : 'Tambah Kategori Tiket Baru'}
                            </h3>
                            <form onSubmit={handleAddOrUpdateTicket} className={styles.modalForm}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nama Kategori</label>
                                    <input
                                        type="text"
                                        placeholder="misal: VIP, Regular, Early Bird"
                                        required
                                        value={newTicket.type}
                                        onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Harga (Rp)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            required
                                            min="0"
                                            value={newTicket.price}
                                            onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Stok</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            required
                                            min="0"
                                            value={newTicket.stock}
                                            onChange={(e) => setNewTicket({ ...newTicket, stock: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Status</label>
                                        <select
                                            value={newTicket.status}
                                            onChange={(e) => setNewTicket({ ...newTicket, status: e.target.value })}
                                            className={styles.input}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="CLOSED">CLOSED</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }}>
                                        {editingTicketId ? 'SIMPAN PERUBAHAN' : 'TAMBAH TIKET'}
                                    </button>
                                    {editingTicketId && (
                                        <button
                                            type="button"
                                            className="btn-outline"
                                            onClick={() => {
                                                setEditingTicketId(null);
                                                setNewTicket({ type: '', price: '', stock: '', status: 'ACTIVE' });
                                            }}
                                            style={{ padding: '0.85rem' }}
                                        >
                                            BATAL
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

