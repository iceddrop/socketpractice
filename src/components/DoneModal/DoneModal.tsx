import { useUIStore } from '../../store/uiStore';
import { FaCircleCheck } from "react-icons/fa6";

interface ModalPropsTwo {
    title: string;
}

export function DoneModal({ title }: ModalPropsTwo) {
    const { isModalOpenTwo, setIsModalOpenTwo } = useUIStore();

    if (!isModalOpenTwo) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className='w-full flex flex-col items-center justify-center'>
                    <h2 className="text-xl font-semibold mb-4">{title}</h2>
                    <FaCircleCheck />
                </div>
                <button
                    onClick={() => setIsModalOpenTwo(!isModalOpenTwo)}
                    className="mt-6 w-full bg-blue-600 px-4 py-2 rounded cursor-pointer"
                >
                    Ok
                </button>
            </div>
        </div>
    );
}