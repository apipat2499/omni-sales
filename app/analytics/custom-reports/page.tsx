"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Play,
  Calendar,
  Clock,
  Star,
  BarChart3,
  FileText,
  Trash2,
  Copy,
  Settings,
} from "lucide-react";
import DimensionSelector from "@/components/reports/DimensionSelector";
import MetricSelector from "@/components/reports/MetricSelector";
import FilterBuilder from "@/components/reports/FilterBuilder";
import ReportPreview from "@/components/reports/ReportPreview";
import {
  executeReport,
  exportToCSV,
  exportToJSON,
  prepareForExcel,
  type ReportConfig,
  type ReportResult,
  type Dimension,
  type Metric,
  type Filter,
  type Sort,
} from "@/lib/analytics/custom-report-engine";

export default function CustomReportsPage() {
  const [userId, setUserId] = useState("user-1");
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Report configuration
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sorting, setSorting] = useState<Sort[]>([]);
  const [chartType, setChartType] = useState<"table" | "bar" | "line" | "pie" | "area">("table");

  // Date range
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Report results
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Saved reports
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"builder" | "saved" | "templates">("builder");

  // Scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: "daily",
    time: "09:00",
    email: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId") || "user-1";
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    loadSavedReports();
    loadTemplates();
  }, [userId]);

  const loadSavedReports = async () => {
    try {
      const response = await fetch(`/api/reports/custom?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error loading saved reports:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/reports/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleRunReport = async () => {
    if (dimensions.length === 0 && metrics.length === 0) {
      alert("Please select at least one dimension or metric");
      return;
    }

    setIsLoading(true);

    try {
      const config: ReportConfig = {
        dimensions,
        metrics,
        filters,
        sorting,
        dateRange,
        limit: 100,
      };

      const result = await executeReport(config, userId, true);
      setReportResult(result);
    } catch (error) {
      console.error("Error executing report:", error);
      alert("Failed to execute report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName) {
      alert("Please enter a report name");
      return;
    }

    try {
      const reportData = {
        userId,
        name: reportName,
        description: reportDescription,
        dimensions,
        metrics,
        filters,
        sorting,
        chartType,
        isTemplate: false,
      };

      const response = await fetch("/api/reports/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        alert("Report saved successfully!");
        setReportName("");
        setReportDescription("");
        loadSavedReports();
      } else {
        alert("Failed to save report");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report");
    }
  };

  const handleLoadReport = (report: any) => {
    setReportName(report.name);
    setReportDescription(report.description || "");
    setDimensions(report.dimensions || []);
    setMetrics(report.metrics || []);
    setFilters(report.filters || []);
    setSorting(report.sorting || []);
    setChartType(report.chart_type || "table");
    setActiveTab("builder");
  };

  const handleLoadTemplate = (template: any) => {
    setReportName(template.name);
    setReportDescription(template.description || "");
    setDimensions(template.dimensions || []);
    setMetrics(template.metrics || []);
    setFilters(template.filters || []);
    setSorting(template.sorting || []);
    setChartType(template.chart_type || "table");
    setActiveTab("builder");
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Report deleted successfully!");
        loadSavedReports();
      } else {
        alert("Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report");
    }
  };

  const handleExport = (format: "csv" | "json" | "excel") => {
    if (!reportResult || !reportResult.data) {
      alert("No data to export");
      return;
    }

    const filename = `${reportName || "report"}-${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "csv":
        exportToCSV(reportResult.data, `${filename}.csv`);
        break;
      case "json":
        exportToJSON(reportResult.data, `${filename}.json`);
        break;
      case "excel":
        const excelData = prepareForExcel(reportResult.data);
        alert("Excel export requires xlsx library. Data prepared: " + JSON.stringify(excelData).substring(0, 100));
        break;
    }
  };

  const handleScheduleReport = async () => {
    if (!reportName) {
      alert("Please save the report first");
      return;
    }

    try {
      const scheduleData = {
        userId,
        reportId: savedReports.find((r) => r.name === reportName)?.id,
        frequency: scheduleConfig.frequency,
        scheduleTime: scheduleConfig.time,
        deliveryConfig: {
          email: [scheduleConfig.email],
          format: "pdf",
        },
      };

      const response = await fetch("/api/reports/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        alert("Report scheduled successfully!");
        setShowScheduleModal(false);
      } else {
        alert("Failed to schedule report");
      }
    } catch (error) {
      console.error("Error scheduling report:", error);
      alert("Failed to schedule report");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Custom Report Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create custom reports with drag-drop dimensions, metrics, and filters
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "builder"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Report Builder
              </div>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "saved"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Saved Reports ({savedReports.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates ({templates.length})
              </div>
            </button>
          </div>
        </div>

        {/* Builder Tab */}
        {activeTab === "builder" && (
          <div className="space-y-6">
            {/* Report Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Report Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Enter description"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Date Range
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions & Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <DimensionSelector
                  selectedDimensions={dimensions}
                  onChange={setDimensions}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <MetricSelector
                  selectedMetrics={metrics}
                  onChange={setMetrics}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <FilterBuilder filters={filters} onChange={setFilters} />
            </div>

            {/* Chart Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Visualization
              </h3>
              <div className="flex gap-2">
                {["table", "bar", "line", "pie", "area"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type as any)}
                    className={`px-4 py-2 rounded-lg border-2 transition ${
                      chartType === type
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRunReport}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Run Report
              </button>
              <button
                onClick={handleSaveReport}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Save className="w-5 h-5" />
                Save Report
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Clock className="w-5 h-5" />
                Schedule
              </button>
            </div>

            {/* Preview */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Report Preview
              </h2>
              <ReportPreview
                result={reportResult}
                isLoading={isLoading}
                chartType={chartType}
                onExport={handleExport}
              />
            </div>
          </div>
        )}

        {/* Saved Reports Tab */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedReports.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No saved reports yet. Create and save a report to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {report.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {report.description || "No description"}
                        </p>
                      </div>
                      {report.is_favorite && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadReport(report)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No templates available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition"
                  >
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        {template.is_featured && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {template.tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Schedule Report
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={scheduleConfig.frequency}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        frequency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={scheduleConfig.email}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleScheduleReport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Schedule
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
