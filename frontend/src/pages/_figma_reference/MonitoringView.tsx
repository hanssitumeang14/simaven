import { useState } from "react";
import { Search, Eye, Filter } from "lucide-react";
import { Project, Vendor } from "../../App";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { Badge } from "../ui/badge";

interface MonitoringViewProps {
  projects: Project[];
  vendors: Vendor[];
}

export function MonitoringView({ projects, vendors }: MonitoringViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBank = bankFilter === "all" || project.bank === bankFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesBank && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Project["status"]) => {
    const styles = {
      ongoing: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const labels = {
      ongoing: "Berjalan",
      completed: "Kadaluarsa",
      cancelled: "Dibatalkan",
    };

    return (
      <Badge className={`${styles[status]} border font-medium`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Monitoring</h1>
        <p className="text-sm text-gray-600">Monitoring Pekerjaan</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Pekerjaan</h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Bank</label>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Lihat semua</option>
              <option value="Mandiri">Bank Mandiri</option>
              <option value="Bank Lainnya">Bank Lainnya</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Lihat semua</option>
              <option value="ongoing">Berjalan</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div className="flex-1" />

          <button className="flex items-center gap-2 px-4 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Cari
          </button>

          <button className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            reset
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">NO</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Kode Paket</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Nama Paket</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Nama Bank</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">HPS</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map((project, index) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-900">{index + 1}</td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{project.code}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{project.name}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900">
                    {project.bank || "-"}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(project.hps)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Lihat
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Tidak ada data proyek yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredProjects.length > 0 ? "1" : "0"} to {Math.min(10, filteredProjects.length)} of {filteredProjects.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded">
              1
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          vendors={vendors}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
