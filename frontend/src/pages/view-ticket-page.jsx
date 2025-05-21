import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useMutation } from 'react-query'; // We'll use useMutation for the download action
import { toast } from 'react-hot-toast';
import { Loader } from '../components/ui/loader';
import { Button } from '../components/ui/button';
import { AlertTriangle, DownloadCloud, Ticket, Info } from 'lucide-react';

// Assuming downloadTicketApiCall is correctly defined in your API service file
// and it's exported.
// e.g., import { downloadTicketApiCall } from '../api/slot-requests';
// For this example, I'll keep it inline as you provided it, but it should be in an API file.




export const downloadTicketApiCall = async (requestId, token) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    let filename = `parking-ticket-${requestId.substring(0, 8)}.pdf`;

    try {
        const response = await fetch(`${API_URL}slot-requests/${requestId}/ticket/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        // If the HTTP response is OK (2xx status), assume the browser is handling the download
        // due to Content-Disposition: attachment. We won't try to process the body.
        if (response.ok) {
            console.log(`[downloadTicketApiCall] HTTP ${response.status} received. Assuming browser is handling download.`);
            const filenameHeader = response.headers.get('content-disposition');
            if (filenameHeader) {
                const parts = filenameHeader.split('filename=');
                if (parts.length > 1) {
                    filename = parts[1].replace(/"/g, '').trim();
                }
            }
            return { success: true, filename: filename };
        } else {
            // If not response.ok, it's a definite error from the server (4xx, 5xx)
            let errorMessage = `Error ${response.status}: Could not download ticket.`;
            try {
                const errorData = await response.json(); // Try to get a JSON error message
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If error response isn't JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            console.error("[downloadTicketApiCall] Server error:", error);
            throw error;
        }

    } catch (error) {
        // This outer catch will primarily handle true network errors ("Failed to fetch")
        // or errors re-thrown from the !response.ok block.
        console.error("[downloadTicketApiCall] Network or processing error:", error);
        if (error.message && (error.message.toLowerCase().includes("failed to fetch") || error.message.toLowerCase().includes("networkerror"))) {
            console.log("Network connection issue. Could not reach the server to download the ticket.");
        }


    }
};




export const ViewTicketPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user }
        = useAuth();
    // If token is not from context, retrieve it from localStorage inside the mutation or useEffect

    const token = localStorage.getItem("token");


    const queryParams = new URLSearchParams(location.search);
    const requestId = queryParams.get('requestId');

    const [pageState, setPageState] = useState({ // Combine loading and error for page
        isLoading: true, // Initially true to check auth and request ID
        error: null,
        message: ""
    });

    const downloadMutation = useMutation(
        () => {
            if (!requestId) throw new Error("Request ID is missing for download.");
            const currentToken = token || localStorage.getItem("token");
            if (!currentToken) throw new Error("Authentication token is missing.");
            return downloadTicketApiCall(requestId, currentToken); // This now returns {success, filename} or throws
        },
        {
            onMutate: () => {
                setPageState(prev => ({ ...prev, isLoading: true, error: null, message: "Initiating download..." }));
            },
            onSuccess: (data) => {
                console.log(data)
                toast.success(`Your has been downloaded!`);
                window.location.href = "/my-vehiles";

            },
            onError: (err) => {
                const errorMsg = err.message || "Could not download ticket. Please try again.";
                toast.error(errorMsg);
                setPageState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
            },
            onSettled: () => {
                // Optionally set isLoading to false here if not done in onSuccess/onError,
                // but it's usually better to do it in those specific handlers.
                // setPageState(prev => ({ ...prev, isLoading: false }));
            }
        }
    );

    useEffect(() => {
        setPageState(prev => ({ ...prev, isLoading: true, error: null })); // Reset on requestId change

        if (!requestId) {
            setPageState({ isLoading: false, error: "Invalid ticket link: Missing request ID.", message: "" });
            toast.error("Invalid ticket link: Missing request ID.");
            return;
        }

        if (!token) {
            toast.error("Please log in to access your ticket.");
            // Redirect to login, preserving the intended download path
            navigate('/login', { state: { from: location, intent: 'viewTicket', requestId: requestId } });
            // setIsLoading(false) will be handled when component unmounts or re-renders after navigation
            return;
        }

        // If we reach here, user is authenticated and requestId is present
        // We don't auto-download anymore, so just set loading to false.
        // We could fetch ticket details here if needed for display before download.
        setPageState(prev => ({ ...prev, isLoading: false, message: "Ready to download your ticket." }));

    }, [requestId, navigate, location]);


    if (pageState.isLoading && !pageState.error && !pageState.message.includes("Download")) { // Show initial page loader
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-page-bg text-text-main p-6">
                <Loader size="default" colorClassName="border-brand-yellow" />
                <p className="mt-4 text-lg">Loading page...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-page-bg text-text-main p-6 text-center">
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-16 w-auto mb-8" />

            <div className="bg-card-bg shadow-2xl rounded-xl p-8 md:p-10 border border-theme-border-default/20 max-w-lg w-full">
                <div className="flex items-center justify-center mb-6">
                    <Ticket className="h-10 w-10 mr-3 text-brand-yellow" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
                        Your Parking Ticket
                    </h1>
                </div>

                {pageState.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-destructive text-destructive p-4 rounded-md" role="alert">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <p className="font-semibold">Oops!</p>
                        </div>
                        <p className="mt-1 text-sm">{pageState.error}</p>
                    </div>
                )}

                {!requestId && !pageState.isLoading && ( // If no requestId after initial load check
                    <div className="mb-6 bg-yellow-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md" role="alert">
                        <div className="flex items-center">
                            <Info className="h-5 w-5 mr-2" />
                            <p className="font-semibold">Invalid Link</p>
                        </div>
                        <p className="mt-1 text-sm">The ticket link seems to be incomplete. Please use the link from your email.</p>
                    </div>
                )}

                {requestId && !pageState.error && (
                    <div className="mb-6 text-center">
                        <p className="text-text-muted mb-2">
                            Your parking ticket for request <code className="text-xs bg-input-bg p-1 rounded font-mono">{requestId.substring(0, 13)}...</code> is ready.
                        </p>
                        <p className="text-text-muted mb-6">
                            Would you like to download it now?
                        </p>
                        <Button
                            onClick={() => downloadMutation.mutate()}
                            disabled={downloadMutation.isLoading}
                            className="w-full sm:w-auto flex items-center justify-center py-3 px-8 text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70"
                        >
                            {downloadMutation.isLoading ? (
                                <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Downloading... </>
                            ) : (
                                <> <DownloadCloud size={20} className="mr-2" /> Download Ticket (PDF) </>
                            )}
                        </Button>
                    </div>
                )}

                {pageState.message && pageState.message.includes("Download") && !pageState.error && (
                    <div className="mt-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md text-sm" role="status">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <p>{pageState.message}</p>
                        </div>
                    </div>
                )}


                <div className="mt-8 text-center">
                    <Link to={user ? "/my-slot-requests" : "/dashboard"} className="text-sm font-medium text-link hover:text-link-hover hover:underline">
                        {user ? "‹ View My Slot Requests" : "‹ Go to Dashboard"}
                    </Link>
                </div>
            </div>

            <p className="text-center text-xs text-text-muted mt-10">
                © {new Date().getFullYear()} ParkWell Systems.
            </p>
        </div>
    );
};