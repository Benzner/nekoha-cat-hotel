import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const ReservationContext = createContext();

export function ReservationProvider({ children }) {
    const [reservations, setReservations] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth(); // Use auth user for history logging

    // Helper to map DB snake_case to App camelCase
    const mapReservationFromDB = (res) => ({
        id: res.id,
        bookerName: res.booker_name,
        bookerContact: res.booker_contact,
        catName: res.cat_name,
        catDetails: res.cat_details,
        customerId: res.customer_id,
        catId: res.cat_id,
        roomType: res.room_type,
        roomNumber: res.room_number,
        checkIn: res.check_in,
        checkOut: res.check_out,
        notes: res.notes,
        status: res.status,
        totalPrice: res.total_price,
        createdAt: res.created_at,
        modifiedAt: res.updated_at
    });

    // Helper to map App camelCase to DB snake_case
    const mapReservationToDB = (res) => {
        const data = {
            booker_name: res.bookerName,
            booker_contact: res.bookerContact,
            cat_name: res.catName,
            cat_details: res.catDetails,
            customer_id: res.customerId || null,
            cat_id: res.catId || null,
            room_type: res.roomType,
            room_number: res.roomNumber,
            check_in: res.checkIn,
            check_out: res.checkOut,
            notes: res.notes,
            status: res.status || 'confirmed',
            total_price: res.totalPrice,
            updated_at: new Date().toISOString()
        };
        // Only include id if it's a valid UUID (skip if it's empty string/temp id)
        // If we are updating, we handle ID separately in the update query usually, but simple mapping helps
        return data;
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Reservations
            const { data: resData, error: resError } = await supabase
                .from('reservations')
                .select('*')
                .order('created_at', { ascending: false });

            if (resError) throw resError;
            setReservations(resData ? resData.map(mapReservationFromDB) : []);

            // Fetch History
            const { data: histData, error: histError } = await supabase
                .from('history')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            if (histError) throw histError;
            // Parse details JSON if needed (Supabase stores json/text, we used text in schema but it might handle auto-parse if json type)
            // schema said TEXT for details, so we might need to JSON.parse if we stored it as stringified JSON
            const parsedHistory = histData ? histData.map(h => ({
                ...h,
                details: h.details ? JSON.parse(h.details) : null
            })) : [];
            setHistory(parsedHistory);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Optional: Set up Realtime subscription here if needed
    }, []);

    const addToHistory = async (action, details, reservationId) => {
        try {
            const historyItem = {
                action,
                details: JSON.stringify(details),
                timestamp: new Date().toISOString(),
                user_id: user?.id,
                // reservationId isn't in our schema explicitly as a foreign key but we could store it in details or add a column
                // Schema had: id, action, details, timestamp, user_id.
            };

            const { data, error } = await supabase.from('history').insert(historyItem).select().single();
            if (data) {
                setHistory(prev => [{ ...data, details: details }, ...prev]);
            }
        } catch (err) {
            console.error("Error logging history:", err);
        }
    };

    const saveReservation = async (reservation) => {
        const dbData = mapReservationToDB(reservation);

        try {
            let savedData;
            if (reservation.id && reservation.id.length > 10) {
                // Assume valid UUID/Server ID if it's long enough. Local temp IDs might be '123'
                // Update existing
                const { data, error } = await supabase
                    .from('reservations')
                    .update(dbData)
                    .eq('id', reservation.id)
                    .select()
                    .single();

                if (error) throw error;
                savedData = mapReservationFromDB(data);

                setReservations(prev => prev.map(r => r.id === reservation.id ? savedData : r));
                addToHistory('updated', { before: reservation, after: savedData }, reservation.id);

            } else {
                // Create new
                const { data, error } = await supabase
                    .from('reservations')
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;
                savedData = mapReservationFromDB(data);

                setReservations(prev => [savedData, ...prev]);
                addToHistory('created', savedData, savedData.id);
            }
            return { success: true, data: savedData };
        } catch (error) {
            console.error("Error saving reservation:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteReservation = async (id) => {
        try {
            const resToDelete = reservations.find(r => r.id === id);

            const { error } = await supabase
                .from('reservations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setReservations(prev => prev.filter(r => r.id !== id));
            addToHistory('deleted', resToDelete, id);
            return { success: true };
        } catch (error) {
            console.error("Error deleting reservation:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <ReservationContext.Provider value={{
            reservations,
            history,
            isLoading,
            saveReservation,
            deleteReservation,
            refreshData: fetchData
        }}>
            {children}
        </ReservationContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationContext);
    if (!context) {
        throw new Error('useReservations must be used within a ReservationProvider');
    }
    return context;
}

