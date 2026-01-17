
import React from 'react';

const Admin: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="serif text-4xl font-bold text-maroon">Admin Dashboard</h1>
          <p className="text-slate-500">Managing Trust & Verification Workflows</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-ivory border border-gray-200 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
              <p className="text-2xl font-bold text-maroon">12,482</p>
           </div>
           <div className="bg-maroon p-4 rounded-2xl text-center text-white">
              <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">Pending Verification</p>
              <p className="text-2xl font-bold text-gold">84</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-bold text-slate-400">
               <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {[1, 2, 3, 4, 5].map((i) => (
                 <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${i+10}/100`} alt="user" />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">Deepak Upadhyay</p>
                          <p className="text-[10px] text-slate-400">deepak.u@example.com</p>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">Jan 14, 2024</td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Citizenship</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div className="bg-green-500 h-full w-[92%]"></div>
                          </div>
                          <span className="text-[10px] font-bold text-green-600">92%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-[10px] font-bold text-maroon hover:text-red-900 border border-maroon/20 px-3 py-1 rounded-md uppercase tracking-wider">Review</button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
         <div className="bg-ivory rounded-3xl p-8 border border-gray-200">
            <h3 className="serif text-2xl font-bold mb-6 text-maroon">Recent Activity</h3>
            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-200 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2"></div>
                    <div>
                       <p className="text-sm text-slate-700"><strong>System</strong> approved ID for <strong>Jeevan Kumar</strong></p>
                       <p className="text-[10px] text-slate-400">2 minutes ago</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h3 className="serif text-2xl font-bold mb-6 text-maroon">Safety Reports</h3>
            <div className="flex flex-col items-center justify-center py-10">
               <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
               <p className="text-slate-400 text-sm">No active safety reports. All clear!</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Admin;
