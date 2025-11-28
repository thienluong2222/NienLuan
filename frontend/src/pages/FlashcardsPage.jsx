import React, { useState, useEffect } from "react";
import { Layers, Loader2 } from "lucide-react";
import { flashcardService } from "../services/api";

export const FlashcardsPage = () => {
    const [decks, setDecks] = useState([]);
    const [activeDeck, setActiveDeck] = useState(null);
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        flashcardService.getAll().then(data => setDecks(data || [])).finally(() => setLoading(false));
    }, []);

    const handleNext = () => {
        if (cardIndex < activeDeck.cards.length - 1) {
            setCardIndex(prev => prev + 1);
            setFlipped(false);
        } else {
            alert("Đã hoàn thành!");
            setActiveDeck(null);
        }
    };

    if (loading) return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

    return (
        <div className="container mx-auto p-6">
            {!activeDeck ? (
                <div className="grid gap-6">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800 border-l-4 border-green-600 pl-4">Thư viện Flashcards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {decks.map((deck) => (
                            <div key={deck._id} onClick={() => { setActiveDeck(deck); setCardIndex(0); setFlipped(false); }} className="p-6 bg-white shadow-md rounded-xl cursor-pointer hover:shadow-lg transition border border-gray-100 group">
                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600">{deck.title}</h3>
                                <p className="text-gray-500 mt-2 flex items-center gap-2"><Layers size={16} /> {deck.cards.length} thẻ</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-xl mx-auto text-center pt-10">
                    <button onClick={() => setActiveDeck(null)} className="mb-6 text-gray-500 hover:text-gray-800 underline">&larr; Quay lại</button>
                    <div onClick={() => setFlipped(!flipped)} className={`h-80 w-full bg-white shadow-2xl rounded-2xl flex items-center justify-center cursor-pointer border-2 relative transition-all duration-500 transform perspective-1000 ${flipped ? "border-green-400" : "border-blue-100"}`} style={{ transformStyle: 'preserve-3d' }}>
                        <div className="text-center px-4">
                            <p className="text-4xl font-bold text-gray-800 mb-4">{flipped ? activeDeck.cards[cardIndex].back : activeDeck.cards[cardIndex].front}</p>
                            <p className="text-sm font-semibold text-blue-500">{flipped ? "Nghĩa" : "Từ vựng"}</p>
                        </div>
                    </div>
                    <button onClick={handleNext} className="mt-8 bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition shadow-lg">Tiếp theo &rarr;</button>
                </div>
            )}
        </div>
    );
};