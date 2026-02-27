// -----------------------------------------------------------
// PatientBanner — Full-width patient identity strip
// -----------------------------------------------------------
// Prominent gradient banner showing all key demographics.
// Patients should immediately confirm "this is MY record."
// Inspired by MyChart-style banners: name, DOB, age, sex,
// MRN, phone, address — all in one glanceable strip.
// -----------------------------------------------------------

import { User, Phone, MapPin, Hash } from "lucide-react";
import type { PatientDemographics } from "../../types/patient";

interface PatientBannerProps {
  patient: PatientDemographics;
}

const PatientBanner = ({ patient }: PatientBannerProps) => {
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl px-6 py-4 text-white shadow-lg">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 ring-2 ring-white/20">
          <span className="text-white text-lg font-bold">{initials}</span>
        </div>

        {/* Primary info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate mb-1">
            {patient.fullName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-slate-300">
            {/* DOB */}
            <span>
              <span className="text-slate-400 font-medium">DOB</span>{" "}
              {patient.birthDate}
            </span>
            {/* Age */}
            <span>
              <span className="text-slate-400 font-medium">Age</span>{" "}
              {patient.age}y
            </span>
            {/* Sex */}
            <span className="flex items-center gap-1">
              <User className="w-4 h-4 text-slate-400" />
              {patient.gender}
            </span>
            {/* MRN */}
            <span className="flex items-center gap-1">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 font-medium">MRN</span>{" "}
              {patient.mrn}
            </span>
            {/* Phone */}
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-slate-400" />
                {patient.phone}
              </span>
            )}
            {/* Address */}
            {patient.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="truncate max-w-xs">{patient.address}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBanner;
