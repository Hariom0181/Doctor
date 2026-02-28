import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, Calendar, Phone, RefreshCw, Stethoscope, User, UserX } from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";

interface PatientHealthcareTeamProps {
  linkedDoctors: LinkedDoctor[];
  isLoadingDoctors: boolean;
  doctorsError: string | null;
}

export function PatientHealthcareTeam({
  linkedDoctors,
  isLoadingDoctors,
  doctorsError,
}: PatientHealthcareTeamProps) {
  return (
    <div className="mb-8  mt-6">
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Stethoscope className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                  My Healthcare Team
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Doctors currently managing your care
                </CardDescription>
              </div>
            </div>

            {/* Doctor count badge */}
            {!isLoadingDoctors && !doctorsError && linkedDoctors.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {linkedDoctors.length} {linkedDoctors.length === 1 ? "Doctor" : "Doctors"}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">

          {/* Loading State */}
          {isLoadingDoctors && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-5 bg-slate-50 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-slate-200 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                  <div className="border-t border-slate-200 pt-4 flex gap-2">
                    <div className="h-9 bg-slate-200 rounded-lg flex-1" />
                    <div className="h-9 bg-slate-200 rounded-lg flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoadingDoctors && doctorsError && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Error Loading Doctors</h3>
              <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">{doctorsError}</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 font-medium gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingDoctors && !doctorsError && linkedDoctors.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <UserX className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">No Doctors Linked</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Your healthcare team will appear here once doctors are assigned to your care.
              </p>
            </div>
          )}

          {/* Doctors Grid */}
          {!isLoadingDoctors && !doctorsError && linkedDoctors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="group relative border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md hover:shadow-slate-200/80 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  {/* Hover top bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Doctor Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-100">
                        <span className="text-blue-600 font-bold text-sm">
                          {doctor.name?.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight truncate">
                          {doctor.name}
                        </h4>
                        <p className="text-xs text-blue-600 font-medium mt-0.5 truncate">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2">
                      {doctor.relationshipStatus}
                    </Badge>
                  </div>

                  {/* Hospital & Linked Date */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      {doctor.hospital}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                      Since{" "}
                      {new Date(doctor.linkedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 mb-4" />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-lg border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Contact
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-9 rounded-lg font-medium text-xs transition-all duration-150 gap-1.5 shadow-sm shadow-blue-200"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}