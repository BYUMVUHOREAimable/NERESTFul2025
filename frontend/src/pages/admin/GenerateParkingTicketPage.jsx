import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card'; // Adjust path
import { Button } from '../../components/ui/button'; 
import { Input } from '../../components/ui/input'; 
import { Label } from '../../components/ui/label';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { Loader } from '../../components/ui/loader'; 
const adminGenerateParkingTicket = async (ticketData) => {
    console.log("Attempting to generate ticket with data:", ticketData);
   
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (ticketData.bookingId === "error") {
        throw new Error("Simulated: Could not find booking.");
    }
    return {
        message: "Parking ticket generated successfully!",
        downloadUrl: `https://example.com/downloads/ticket-${ticketData.bookingId}-${Date.now()}.pdf`
    };
};


export const GenerateParkingTicketPage = () => {
    const [bookingId, setBookingId] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [error, setError] = useState('');

    const mutation = useMutation(adminGenerateParkingTicket, {
        onSuccess: (data) => {
            toast.success(data.message);
            setGeneratedLink(data.downloadUrl);
            setError('');
            setBookingId(''); 
        },
        onError: (error) => {
            toast.error(error.message || "Failed to generate ticket. Please try again.");
            setError(error.message || "An unexpected error occurred.");
            setGeneratedLink('');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!bookingId.trim()) {
            toast.error("Please enter a Booking ID.");
            return;
        }
        setError('');
        setGeneratedLink('');
        mutation.mutate({ bookingId: bookingId.trim()  });
    };

    return (
        <div className="container mx-auto p-4 md:p-6">
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Generate Parking Ticket</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="bookingId" className="text-sm font-medium">Booking ID</Label>
                            <Input
                                id="bookingId"
                                type="text"
                                placeholder="Enter Booking ID (e.g., BOOK123XYZ)"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500">
                                Enter the ID of the approved booking for which to generate a ticket.
                            </p>
                        </div>

                      

                    </CardContent>
                    <CardFooter className="flex flex-col items-center space-y-4">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto bg-brand-yellow hover:bg-brand-yellow/80"
                            disabled={mutation.isLoading}
                        >
                            {mutation.isLoading ? (
                                <>
                                    <Loader size="sm" className="mr-2" colorClassName="border-white" />
                                    Generating...
                                </>
                            ) : (
                                "Generate Ticket"
                            )}
                        </Button>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        {generatedLink && (
                            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md w-full">
                                <p className="text-sm font-medium text-green-700 mb-2">Ticket generated successfully!</p>
                                <a
                                    href={generatedLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Download Ticket (PDF)
                                </a>
                                <p className="text-xs text-gray-600 mt-2">
                                    Link: <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-700">{generatedLink}</a>
                                </p>
                            </div>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};