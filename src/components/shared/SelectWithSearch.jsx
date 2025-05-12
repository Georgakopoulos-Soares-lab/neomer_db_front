import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const SelectWithSearch = ({ columns, handleAddGroupBy }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredColumns = columns.filter(
        (col) => col.key !== "nullomers_created" && col.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full">
            <div
                className="border px-4 py-2 rounded-lg bg-white hover:bg-gray-100 w-full cursor-pointer shadow-sm flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">Select column...</span>
                <FaChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full border rounded-lg bg-white shadow-lg mt-1 overflow-hidden">
                    <input
                        type="text"
                        placeholder="Search column..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border-b outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="max-h-48 overflow-auto">
                        {filteredColumns.length > 0 ? (
                            filteredColumns.map((col) => (
                                <div
                                    key={col.key}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                                    onClick={() => {
                                        handleAddGroupBy(col.key);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    {col.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-gray-500">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectWithSearch;
