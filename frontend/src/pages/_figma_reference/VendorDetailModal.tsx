import { useState } from "react";
import {
  X,
  Check,
  FileText,
  Building2,
  CreditCard,
  Shield,
  Upload,
  Link as LinkIcon,
  TrendingUp,
} from "lucide-react";
import { Vendor } from "../../App";
import { toast } from "sonner";

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
  onUpdate: (vendor: Vendor) => void;
}

const verificationSteps = [
  { id: 1, label: "Upload Dokumen", icon: Upload },
  { id: 2, label: "Verifikasi Logistik", icon: Shield },
  { id: 3, label: "Verifikasi Keuangan", icon: TrendingUp },
  { id: 4, label: "Verifikasi Legal", icon: FileText },
  { id: 5, label: "Upload Form Aplikasi Vendor", icon: Upload },
  {
    id: 6,
    label: "Verifikasi Form Aplikasi Vendor",
    icon: Check,
  },
  { id: 7, label: "Verifikasi Struktural", icon: Building2 },
  { id: 8, label: "Data Perusahaan", icon: Shield },
];

const bankMandiriProducts = [
  {
    title: "Bank Garansi",
    description: "Jaminan pembayaran untuk tender proyek",
    link: "https://www.bankmandiri.co.id/kopra-trade?utm_source=google&utm_medium=cpc&utm_campaign=PFM031_B01_L2_MLC_KO_AON_May26_General&utm_content=Trade_Bank_Garansi&gad_source=1&gad_campaignid=23820351836&gbraid=0AAAAABhQExDTysGT1PF-w5H1jFepBweZ_&gclid=Cj0KCQjww8rQBhDjARIsAE43KPPeOYgJmkdgAXtXnWZW92rlOOfP-uLnDwfT0DBRJ6nokYvemHOaDOgaAlSlEALw_wcB",
    icon: Shield,
  },
  {
    title: "Kredit Modal Kerja",
    description: "Pembiayaan untuk modal usaha",
    link: "https://www.bankmandiri.co.id/kredit-modal-kerja",
    icon: TrendingUp,
  },
  {
    title: "Rekening Giro",
    description: "Pembukaan rekening untuk transaksi bisnis",
    link: "https://www.bankmandiri.co.id/giro",
    icon: Building2,
  },
];

export function VendorDetailModal({
  vendor,
  onClose,
  onUpdate,
}: VendorDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "info" | "documents" | "verification" | "products" | "5c"
  >("info");

  const handleVerificationComplete = () => {
    const updatedVendor: Vendor = {
      ...vendor,
      status: "verified",
      verificationStep: 8,
    };
    onUpdate(updatedVendor);
    toast.success("Verifikasi berhasil!");
  };

  const tabs = [
    {
      id: "info" as const,
      label: "Data Perusahaan",
      icon: Building2,
    },
    {
      id: "documents" as const,
      label: "Dokumen Administrasi",
      icon: FileText,
    },
    {
      id: "verification" as const,
      label: "Proses Verifikasi",
      icon: Check,
    },
    {
      id: "products" as const,
      label: "Produk Bank Mandiri",
      icon: LinkIcon,
    },
    { id: "5c" as const, label: "Profil 5C", icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {vendor.companyName}
              </h2>
              <p className="text-sm text-white/90">
                NPWP: {vendor.npwp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Verification Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress Verifikasi: {vendor.verificationStep}/8
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((vendor.verificationStep / 8) * 100)}%
            </span>
          </div>
          <div className="relative">
            <div className="flex items-center gap-1">
              {verificationSteps.map((step, index) => {
                const Icon = step.icon;
                const isComplete =
                  vendor.verificationStep >= step.id;
                const isCurrent =
                  vendor.verificationStep + 1 === step.id;

                return (
                  <div key={step.id} className="flex-1">
                    <div
                      className={`
                        relative h-2 rounded-full transition-all
                        ${isComplete ? "bg-emerald-500" : isCurrent ? "bg-emerald-200" : "bg-gray-200"}
                      `}
                    >
                      {isComplete && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-xs font-medium ${isComplete ? "text-emerald-600" : "text-gray-500"}`}
                      >
                        {step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* DRI Tab */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NPWP
                  </label>
                  <input
                    type="text"
                    value={vendor.npwp}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    value={vendor.companyName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Perusahaan
                  </label>
                  <input
                    type="text"
                    value={vendor.companyType}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota
                  </label>
                  <input
                    type="text"
                    value={vendor.city}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={vendor.address}
                    readOnly
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vendor.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={vendor.phone}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Rekanan
                  </label>
                  <input
                    type="text"
                    value={vendor.bank}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    value={vendor.bankName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Dokumen yang Diperlukan
                </h3>
                <p className="text-sm text-gray-600">
                  Vendor wajib melengkapi dokumen: SPT Tahunan,
                  Neraca Keuangan, Anggaran Dasar, dan Izin
                  Perusahaan
                </p>
              </div>

              {[
                {
                  key: "sptTahunan",
                  label: "SPT Tahunan",
                  required: true,
                },
                {
                  key: "neraca",
                  label: "Neraca Keuangan",
                  required: true,
                },
                {
                  key: "anggaranDasar",
                  label: "Anggaran Dasar / Akta Pendirian",
                  required: true,
                },
                {
                  key: "izinPerusahaan",
                  label: "Izin Perusahaan (SIUP/NIB)",
                  required: true,
                },
                {
                  key: "rekening",
                  label: "Informasi Rekening Bank",
                  required: false,
                },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        vendor.documents[
                          doc.key as keyof typeof vendor.documents
                        ]
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 ${
                          vendor.documents[
                            doc.key as keyof typeof vendor.documents
                          ]
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {doc.label}
                      </div>
                      {doc.required && (
                        <div className="text-xs text-red-600">
                          * Wajib
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {vendor.documents[
                      doc.key as keyof typeof vendor.documents
                    ] ? (
                      <>
                        <span className="text-sm text-emerald-600 font-medium">
                          ✓{" "}
                          {
                            vendor.documents[
                              doc.key as keyof typeof vendor.documents
                            ]
                          }
                        </span>
                        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Lihat
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Belum diunggah
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {verificationSteps.map((step) => {
                  const Icon = step.icon;
                  const isComplete =
                    vendor.verificationStep >= step.id;
                  const isCurrent =
                    vendor.verificationStep + 1 === step.id;

                  return (
                    <div
                      key={step.id}
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                        ${isComplete ? "border-emerald-500 bg-emerald-50" : isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}
                      `}
                    >
                      <div
                        className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                        ${isComplete ? "bg-emerald-500 text-white" : isCurrent ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}
                      `}
                      >
                        {isComplete ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-5 h-5 ${isComplete ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-gray-400"}`}
                          />
                          <h4
                            className={`font-semibold ${isComplete ? "text-emerald-900" : isCurrent ? "text-blue-900" : "text-gray-700"}`}
                          >
                            {step.label}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {isComplete
                            ? "Verifikasi selesai"
                            : isCurrent
                              ? "Sedang dalam proses"
                              : "Menunggu verifikasi"}
                        </p>
                      </div>
                      <div>
                        {isComplete && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3 mr-1" />
                            Verifikasi
                          </span>
                        )}
                        {isCurrent && (
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            Verifikasi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {vendor.verificationStep < 8 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Catatan:</strong> Vendor ini masih
                    dalam proses verifikasi. Lengkapi semua
                    tahapan untuk menyelesaikan verifikasi.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bank Mandiri Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">
                  Produk Bank Mandiri untuk Vendor
                </h3>
                <p className="text-blue-100">
                  Dapatkan kemudahan dalam mengelola keuangan
                  bisnis Anda dengan produk-produk Bank Mandiri
                </p>
              </div>

              {bankMandiriProducts.map((product, index) => {
                const Icon = product.icon;
                return (
                  <div
                    key={index}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {product.description}
                        </p>
                        <a
                          href={product.link}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Pelajari Lebih Lanjut
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Hubungi relationship
                  manager Bank Mandiri Anda untuk konsultasi
                  produk yang sesuai dengan kebutuhan bisnis.
                </p>
              </div>
            </div>
          )}

          {/* 5C Profile Tab */}
          {activeTab === "5c" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analisis 5C Vendor
                </h3>
                <p className="text-sm text-gray-600">
                  Penilaian komprehensif berdasarkan Character,
                  Capacity, Capital, Collateral, dan Condition
                </p>
              </div>

              {vendor.financialScore ? (
                <div className="space-y-4">
                  {[
                    {
                      key: "character",
                      label: "Character (Karakter)",
                      description:
                        "Integritas dan rekam jejak vendor",
                    },
                    {
                      key: "capacity",
                      label: "Capacity (Kapasitas)",
                      description:
                        "Kemampuan memenuhi kewajiban",
                    },
                    {
                      key: "capital",
                      label: "Capital (Modal)",
                      description:
                        "Kekuatan finansial perusahaan",
                    },
                    {
                      key: "collateral",
                      label: "Collateral (Jaminan)",
                      description: "Aset yang dapat dijaminkan",
                    },
                    {
                      key: "condition",
                      label: "Condition (Kondisi)",
                      description:
                        "Kondisi ekonomi dan industri",
                    },
                  ].map((item) => {
                    const score =
                      vendor.financialScore?.[
                        item.key as keyof typeof vendor.financialScore
                      ] || 0;
                    const percentage = score;

                    return (
                      <div
                        key={item.key}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.label}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {score}
                          </div>
                        </div>
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                              score >= 80
                                ? "bg-emerald-500"
                                : score >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">
                          Skor Keseluruhan
                        </h4>
                        <p className="text-sm text-white/90">
                          Rata-rata dari semua kategori
                        </p>
                      </div>
                      <div className="text-4xl font-bold">
                        {Math.round(
                          Object.values(
                            vendor.financialScore,
                          ).reduce((a, b) => a + b, 0) / 5,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Belum Ada Penilaian 5C
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Vendor ini belum memiliki profil 5C.
                    Lengkapi verifikasi untuk mendapatkan
                    penilaian.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vendor.status === "verified" ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  Vendor Terverifikasi
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                <span className="font-medium">
                  Status:{" "}
                  {vendor.status === "pending"
                    ? "Menunggu"
                    : "Perlu Verifikasi"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {vendor.verificationStep === 8 &&
              vendor.status !== "verified" && (
                <button
                  onClick={handleVerificationComplete}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                >
                  Tandai Sebagai Terverifikasi
                </button>
              )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}