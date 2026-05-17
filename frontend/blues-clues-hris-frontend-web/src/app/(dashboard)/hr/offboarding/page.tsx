"use client";

import React, { useState } from "react";
import { 
  UserMinus, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Plus,
  Key,
  DollarSign,
  ClipboardCheck,
  Search,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HROffboardingPage() {
  const [hasInitiated, setHasInitiated] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserMinus className="h-8 w-8 text-rose-500" />
            Offboarding Management
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage employee exit processes and final settlements.
          </p>
        </div>
        <Button 
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-11 px-6 shadow-lg transition-all active:scale-95"
          onClick={() => setHasInitiated(true)}
        >
          <Plus className="h-5 w-5" />
          Initiate Offboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Offboarding</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-900">{hasInitiated ? "1" : "0"}</p>
                <p className="text-xs text-slate-400">Active cases</p>
              </div>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-xs text-slate-400">All time</p>
              </div>
            </div>
            <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Review</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-900">{hasInitiated ? "1" : "0"}</p>
                <p className="text-xs text-slate-400">Require action</p>
              </div>
            </div>
            <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Incoming Requests */}
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold">Incoming Offboarding Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasInitiated ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <Search className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">John Doe</p>
                    <p className="text-xs text-slate-500">Engineering</p>
                  </div>
                  <div className="flex-1 text-center">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Termination</Badge>
                    <p className="text-[10px] text-slate-400 mt-1">2026-04-14</p>
                  </div>
                  <div className="flex-1 text-center">
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 rounded-full px-3">Pending Review</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-200 bg-green-50 text-green-600 hover:bg-green-100">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access and Pay Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200/60 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-orange-600">
                <Key className="h-4 w-4" />
                System Access Revocation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <p className="text-xs text-center font-medium">Select an employee to manage access</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-green-600">
                <DollarSign className="h-4 w-4" />
                Final Pay
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <p className="text-xs text-center font-medium">Accept offboarding to manage final pay</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist Verification */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold">Checklist Verification</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasInitiated ? (
               <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                  <ClipboardCheck className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No checklist items to verify</p>
               </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[
                  "Company ID Card",
                  "Laptop Return",
                  "Knowledge Transfer Document",
                  "Exit Interview Scheduled",
                  "Access Card Return"
                ].map((item, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-900">John Doe</p>
                      <p className="text-[11px] text-slate-500">{item}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 px-2 rounded-full text-[10px]">Pending Review</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-slate-600 hover:text-slate-900 font-bold text-xs gap-1"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offboarding Overview */}
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold">Offboarding Overview</CardTitle>
          </CardHeader>
          <CardContent className="py-16 flex flex-col items-center justify-center text-slate-400">
            <p className="text-sm">No active offboarding cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Item Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ml-0 lg:ml-64">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Checklist Item Details</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Plus className="h-5 w-5 rotate-45 text-slate-500" />
                </button>
              </div>

              {/* Details Sections */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</p>
                  <p className="text-base font-bold text-slate-900">John Doe</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Checklist Item</p>
                  <p className="text-base font-bold text-slate-900">{selectedItem || "Company ID Card"}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <div className="mt-1">
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                      Pending Review
                    </Badge>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <span className="font-bold">Note:</span> Employee has not yet submitted proof for this item.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
