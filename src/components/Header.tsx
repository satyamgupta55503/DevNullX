import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import devnullxLogo from '../images/devnullx.png'; // <-- image import

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            {/* Replace Truck Icon with Image */}
            <img 
              src={devnullxLogo} 
              alt="DevNullX Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-white">DEV NULL X</h1>
              <p className="text-xs text-gray-400">Vehical Tracking system Management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
