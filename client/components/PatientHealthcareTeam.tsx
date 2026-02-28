import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, Phone, Stethoscope, User } from "lucide-react";
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
    <div className="mb-8">
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Top accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-blue-400/30 to-transparent" />

        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  My Healthcare Team
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-medium mt-0.5">
                  Doctors currently managing your care
                </CardDescription>
              </div>
            </div>

            {/* Doctor count badge */}
            {!isLoadingDoctors && !doctorsError && linkedDoctors.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {linkedDoctors.length} {linkedDoctors.length === 1 ? 'Doctor' : 'Doctors'}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">

          {/* Loading State */}
          {isLoadingDoctors && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                      <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded-lg w-full" />
                    <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-9 bg-slate-200 rounded-xl flex-1" />
                    <div className="h-9 bg-slate-200 rounded-xl flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoadingDoctors && doctorsError && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">Error Loading Doctors</h3>
              <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">{doctorsError}</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 font-semibold"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingDoctors && !doctorsError && linkedDoctors.length === 0 && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">No Doctors Linked</h3>
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
                  className="group relative border border-slate-200/80 rounded-2xl p-5 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Card top accent on hover */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Doctor Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center shrink-0 border border-primary/10">
                        <span className="text-primary font-black text-sm">
                          {doctor.name?.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 text-sm leading-tight truncate">
                          {doctor.name}
                        </h4>
                        <p className="text-xs text-primary font-bold mt-0.5 truncate">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ml-2">
                      {doctor.relationshipStatus}
                    </Badge>
                  </div>

                  {/* Hospital & Date */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block shrink-0" />
                      {doctor.hospital}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 inline-block shrink-0" />
                      Linked since: {new Date(doctor.linkedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 mb-4" />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-xl border-primary/20 text-primary font-semibold text-xs hover:bg-primary/5 hover:border-primary/40 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
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