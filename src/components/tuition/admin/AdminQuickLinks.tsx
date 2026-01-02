import { 
  PiggyBank, 
  TrendingUp, 
  BookOpen, 
  Calculator, 
  Activity, 
  Grid,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  {
    title: 'CPF Calculator',
    description: 'Plan your retirement readiness',
    icon: PiggyBank,
    href: '/CPF.html',
    color: 'from-red-500 to-rose-600',
    external: true
  },
  {
    title: 'Investment Tracker',
    description: 'Monitor your portfolio',
    icon: TrendingUp,
    href: '/investment.html',
    color: 'from-emerald-500 to-teal-600',
    external: true
  },
  {
    title: 'Money Counter',
    description: 'Real-time earning tracker',
    icon: Calculator,
    href: '/money_counter.html',
    color: 'from-amber-500 to-orange-600',
    external: true
  },
  {
    title: 'Work Progress',
    description: 'Track daily tasks & progress',
    icon: Activity,
    href: '/work-progress',
    color: 'from-blue-500 to-indigo-600',
    external: false
  },
  {
    title: 'Learning Points',
    description: 'Knowledge base & debugging',
    icon: BookOpen,
    href: '/learningpoints.html',
    color: 'from-purple-500 to-violet-600',
    external: true
  },
  {
    title: 'Grid Explorer',
    description: 'The main data dashboard',
    icon: Grid,
    href: '/explorer',
    color: 'from-indigo-600 to-blue-700',
    external: false
  }
];

const AdminQuickLinks = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-indigo-600" />
          Quick Access: Tools & Dashboards
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Jump to other modules and utility pages
        </p>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link, index) => {
            const Icon = link.icon;
                   const Content = (
                     <>
                       <div className={`p-3 rounded-xl bg-gradient-to-br ${link.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                         <Icon className="w-6 h-6" />
                       </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {link.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </>
            );

                   const className = "group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-100 transition-all duration-300";

            if (link.external) {
              return (
                <a 
                  key={index} 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={className}
                >
                  {Content}
                </a>
              );
            }

            return (
              <Link 
                key={index} 
                to={link.href} 
                className={className}
              >
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminQuickLinks;

