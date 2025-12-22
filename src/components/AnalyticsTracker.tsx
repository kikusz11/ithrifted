import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        // 1. Track Page View
        const trackView = async () => {
            try {
                // Get or create a session ID from localStorage
                let sessionId = localStorage.getItem('analytics_session_id');
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    localStorage.setItem('analytics_session_id', sessionId);
                }

                await supabase.from('page_views').insert({
                    path: location.pathname,
                    user_agent: navigator.userAgent,
                    session_id: sessionId
                });
            } catch (error) {
                console.error('Error tracking view:', error);
            }
        };

        trackView();
    }, [location]);

    useEffect(() => {
        // 2. Real-time Presence (Live Users)
        const channel = supabase.channel('online-users');

        channel
            .on('presence', { event: 'sync' }, () => {
                // We don't need to do anything here, just being present is enough
                // for the admin dashboard to count us.
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const sessionId = localStorage.getItem('analytics_session_id') || crypto.randomUUID();
                    if (!localStorage.getItem('analytics_session_id')) {
                        localStorage.setItem('analytics_session_id', sessionId);
                    }

                    await channel.track({
                        online_at: new Date().toISOString(),
                        session_id: sessionId
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    return null; // This component renders nothing
}
