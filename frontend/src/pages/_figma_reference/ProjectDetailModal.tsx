import { X, FileText, Building2, Users, Award } from "lucide-react";
import { Project, Vendor } from "../../App";

interface ProjectDetailModalProps {
  project: Project;
  vendors: Vendor[];
  onClose: () => void;
}

export function ProjectDetailModal({ project, vendors, onClose }: ProjectDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const participatingVendors = project.vendors
    ? vendors.filter(v => project.vendors?.includes(v.id))
    : [];

  const winningVendor = project.winningVendor
    ? vendors.find(v => v.id === project.winningVendor)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-900 to-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{project.name}</h2>
              <p className="text-sm text-blue-100">Kode: {project.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Project Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Proyek</h3>
            <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Kode Paket</label>
                <div className="text-gray-900 font-medium">{project.code}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nama Paket</label>
                <div className="text-gray-900 font-medium">{project.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Pengadaan</label>
                <div className="text-gray-900 font-medium">{project.type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pagu</label>
                <div className="text-gray-900 font-medium">{formatCurrency(project.budget)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">HPS</label>
                <div className="text-gray-900 font-medium">{formatCurrency(project.hps)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bank</label>
                <div className="text-gray-900 font-medium">{project.bank || "-"}</div>
              </div>
            </div>
          </div>

          {/* Winning Vendor */}
          {winningVendor && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Pemenang
              </h3>
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nama Pemenang</label>
                    <div className="text-gray-900 font-semibold">{winningVendor.companyName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Bank</label>
                    <div className="text-gray-900 font-medium">{winningVendor.bank}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Alamat</label>
                    <div className="text-gray-900">{winningVendor.address}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">NPWP</label>
                    <div className="text-gray-900">{winningVendor.npwp}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Penawaran</label>
                    <div className="text-gray-900 font-medium">{formatCurrency(project.hps * 0.98)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Terkoreksi</label>
                    <div className="text-gray-900 font-medium">{formatCurrency(project.hps * 0.98)}</div>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hasil Negosiasi</label>
                    <div className="text-gray-900 font-medium">{formatCurrency(project.hps * 0.95)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Participating Vendors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Daftar Peserta
            </h3>
            
            {participatingVendors.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Nama Vendor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Jenis Bank</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Alamat</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">NPWP</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Harga Penawaran</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Harga Terkoreksi</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Hasil Negosiasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participatingVendors.map((vendor, index) => (
                      <tr key={vendor.id} className={vendor.id === project.winningVendor ? "bg-yellow-50" : ""}>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          {vendor.companyName}
                          {vendor.id === project.winningVendor && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Award className="w-3 h-3 mr-1" />
                              Pemenang
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{vendor.bank}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{vendor.city}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{vendor.npwp}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium text-right">
                          {formatCurrency(project.hps * (0.9 + index * 0.03))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium text-right">
                          {formatCurrency(project.hps * (0.9 + index * 0.03))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium text-right">
                          {vendor.id === project.winningVendor 
                            ? formatCurrency(project.hps * 0.95)
                            : formatCurrency(0)
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada data peserta</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
