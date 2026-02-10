"use client";

import { useBooking, useContractor, useAuth } from "@/contexts";
import { useState } from "react";

/**
 * Test page to verify all contexts are working
 * Navigate to /test-contexts to use this
 */
export default function TestContextsPage() {
  const booking = useBooking();
  const contractor = useContractor();
  const auth = useAuth();
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLog((prev) => [...prev, `✅ ${message}`]);
  };

  const runTests = () => {
    setTestLog([]);

    // Test 1: Service selection
    try {
      booking.setService({
        id: "test-service",
        name: "Test Service",
        nameEs: "Servicio de Prueba",
        description: "Test description",
        descriptionEs: "Descripción de prueba",
        basePrice: 100,
        duration: 90,
      });
      addLog("Service selection works");
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Service selection failed: ${error}`]);
    }

    // Test 2: Add-on management
    try {
      booking.addAddOn({
        id: "test-addon",
        name: "Test Add-on",
        nameEs: "Extra de Prueba",
        price: 25,
      });
      addLog("Add-on addition works");

      booking.removeAddOn("test-addon");
      addLog("Add-on removal works");
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Add-on management failed: ${error}`]);
    }

    // Test 3: Location setting
    try {
      booking.setLocation({
        address: "123 Test St, Miami, FL 33186",
        zipCode: "33186",
        latitude: 25.7617,
        longitude: -80.1918,
      });
      addLog("Location setting works");
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Location setting failed: ${error}`]);
    }

    // Test 4: Schedule setting
    try {
      booking.setSchedule(new Date(), {
        slot: "morning",
        label: "Morning",
        labelEs: "Mañana",
        range: "9AM-12PM",
      });
      addLog("Schedule setting works");
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Schedule setting failed: ${error}`]);
    }

    // Test 5: Pricing calculation
    try {
      booking.calculateTotal();
      addLog(`Pricing calculation works - Total: $${booking.total.toFixed(2)}`);
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Pricing calculation failed: ${error}`]);
    }

    // Test 6: Step navigation
    try {
      booking.nextStep();
      addLog(`Step navigation works - Current step: ${booking.currentStep}`);
    } catch (error) {
      setTestLog((prev) => [...prev, `❌ Step navigation failed: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Context Test Page</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Test Runner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Run Tests</h2>
            <button
              onClick={runTests}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 mb-4"
            >
              Run All Tests
            </button>

            {testLog.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                {testLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context States */}
          <div className="space-y-6">
            {/* Booking Context */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">📋 Booking Context</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Selected Service:</span>{" "}
                  {booking.selectedService?.name || "None"}
                </div>
                <div>
                  <span className="font-semibold">Add-ons:</span>{" "}
                  {booking.selectedAddOns.length}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  {booking.customerLocation?.zipCode || "Not set"}
                </div>
                <div>
                  <span className="font-semibold">Date:</span>{" "}
                  {booking.selectedDate?.toLocaleDateString() || "Not set"}
                </div>
                <div>
                  <span className="font-semibold">Current Step:</span>{" "}
                  {booking.currentStep}/5
                </div>
                <div className="pt-2 border-t">
                  <span className="font-semibold text-lg">Total:</span>{" "}
                  <span className="text-blue-600 font-bold text-xl">
                    ${booking.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contractor Context */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">👷 Contractor Context</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Available:</span>{" "}
                  {contractor.availableContractors.length}
                </div>
                <div>
                  <span className="font-semibold">Selected:</span>{" "}
                  {contractor.selectedContractor?.name || "None"}
                </div>
                <div>
                  <span className="font-semibold">Assigned:</span>{" "}
                  {contractor.assignedContractor?.name || "None"}
                </div>
                <div>
                  <span className="font-semibold">Loading:</span>{" "}
                  {contractor.isLoadingContractors ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Auth Context */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">🔐 Auth Context</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Authenticated:</span>{" "}
                  {auth.isAuthenticated ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-semibold">User:</span>{" "}
                  {auth.user?.email || "Not logged in"}
                </div>
                <div>
                  <span className="font-semibold">Role:</span>{" "}
                  {auth.user?.role || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Loading:</span>{" "}
                  {auth.isLoading ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-bold mb-4">🔗 Test Other Pages:</h3>
          <div className="space-y-2">
            <a
              href="/en/services"
              className="block text-blue-600 hover:text-blue-800 font-medium"
            >
              → Service Selection Page (English)
            </a>
            <a
              href="/es/services"
              className="block text-blue-600 hover:text-blue-800 font-medium"
            >
              → Service Selection Page (Spanish)
            </a>
          </div>
        </div>

        {/* Raw State Dump */}
        <div className="mt-8">
          <details className="bg-gray-100 rounded-lg p-4">
            <summary className="font-bold cursor-pointer">
              🔍 View Raw State (Debug)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Booking State:</h4>
                <pre className="bg-white p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(
                    {
                      selectedService: booking.selectedService,
                      selectedAddOns: booking.selectedAddOns,
                      customerLocation: booking.customerLocation,
                      selectedDate: booking.selectedDate,
                      selectedTimeWindow: booking.selectedTimeWindow,
                      subtotal: booking.subtotal,
                      serviceFee: booking.serviceFee,
                      total: booking.total,
                      currentStep: booking.currentStep,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
