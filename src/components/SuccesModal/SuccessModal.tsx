import { useUIStore } from '../../store/uiStore';

interface ModalProps {
  title: string;
  children: React.ReactNode;
}

export function SuccessModal({ title, children }: ModalProps) {
  const { isModalOpen, setIsModalOpen } = useUIStore();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="mt-6 w-full bg-blue-600 px-4 py-2 rounded cursor-pointer"
        >
          Ok
        </button>
      </div>
    </div>
  );
}