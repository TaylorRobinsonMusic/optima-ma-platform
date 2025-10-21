import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  Columns3, 
  X,
  Star,
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Prospect {
  "Company Name": string;
  "Company LinkedIn URL": string;
  fullName: string;
  firstName: string;
  lastName: string;
  linkedinProfileUrl: string;
  linkedinJobTitle: string;
  linkedinJobDateRange: string;
  companyIndustry: string;
  location: string;
  professionalEmail1: string;
  linkedinFollowersCount: string | number;
  "Decision Maker Status 1": string;
  "Decision Maker Status 2": string;
  "Primary Decision Makers Count": number;
  "Primary Decision Makers Count (Inactive)": number;
  "Secondary Decision Makers Count": number;
  "Secondary Decision Makers Count (Inactive)": number;
  "Not a Decision Makers Count": number;
  "Not a Decision Makers Count (Inactive)": number;
  "Total Inactive Contacts": number;
  "Total Active Contacts": number;
  "Total ALL Contacts": number;
  "Estimated Contact Age": number | string;
  "Boomer Score": number | string;
  "Years in Current Role": number | string;
  "Burnout Score": number | string;
  "Industry Hotness Score": number | string;
  "Contact Accessibility Score": number | string;
  "Education Pedigree Score": number | string;
  "Serial Entrepreneur Score": number | string;
  "Company Maturity Score": number | string;
  "Combined Acquisition Score": number | string;
}

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [scoreFilters, setScoreFilters] = useState({
    combinedMin: 0,
    combinedMax: 100,
    boomerMin: 0,
    boomerMax: 100,
    burnoutMin: 0,
    burnoutMax: 100,
  });
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    "rating",
    "Combined Acquisition Score",
    "Company Name",
    "fullName",
    "linkedinJobTitle",
    "Boomer Score",
    "Burnout Score",
    "Industry Hotness Score",
    "companyIndustry",
    "Estimated Contact Age",
    "Years in Current Role",
  ]));

  useEffect(() => {
    fetch("/prospects-data.json")
      .then((res) => res.json())
      .then((data) => {
        setProspects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setLoading(false);
      });
  }, []);

  // Get unique industries
  const industries = useMemo(() => {
    const unique = new Set(prospects.map(p => p.companyIndustry).filter(Boolean));
    return Array.from(unique).sort();
  }, [prospects]);

  // Filter and search
  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        prospect["Company Name"]?.toLowerCase().includes(searchLower) ||
        prospect.fullName?.toLowerCase().includes(searchLower) ||
        prospect.linkedinJobTitle?.toLowerCase().includes(searchLower) ||
        prospect.companyIndustry?.toLowerCase().includes(searchLower);

      // Industry filter
      const matchesIndustry = selectedIndustries.length === 0 || 
        selectedIndustries.includes(prospect.companyIndustry);

      // Score filters
      const combinedScore = Number(prospect["Combined Acquisition Score"]) || 0;
      const boomerScore = Number(prospect["Boomer Score"]) || 0;
      const burnoutScore = Number(prospect["Burnout Score"]) || 0;

      const matchesScores = 
        combinedScore >= scoreFilters.combinedMin &&
        combinedScore <= scoreFilters.combinedMax &&
        boomerScore >= scoreFilters.boomerMin &&
        boomerScore <= scoreFilters.boomerMax &&
        burnoutScore >= scoreFilters.burnoutMin &&
        burnoutScore <= scoreFilters.burnoutMax;

      return matchesSearch && matchesIndustry && matchesScores;
    });
  }, [prospects, searchTerm, selectedIndustries, scoreFilters]);

  // Sort by Combined Acquisition Score
  const sortedProspects = useMemo(() => {
    return [...filteredProspects].sort((a, b) => {
      const scoreA = Number(a["Combined Acquisition Score"]) || 0;
      const scoreB = Number(b["Combined Acquisition Score"]) || 0;
      return scoreB - scoreA;
    });
  }, [filteredProspects]);

  // Group prospects
  const groupedProspects = useMemo(() => {
    if (groupBy === "none") {
      return { "All Prospects": sortedProspects };
    }

    const groups: Record<string, Prospect[]> = {};
    
    sortedProspects.forEach(prospect => {
      let groupKey = "";
      
      if (groupBy === "Combined Acquisition Score") {
        const score = Number(prospect["Combined Acquisition Score"]) || 0;
        if (score >= 70) groupKey = "Excellent (70-100)";
        else if (score >= 50) groupKey = "Good (50-69)";
        else if (score >= 30) groupKey = "Fair (30-49)";
        else groupKey = "Low (0-29)";
      } else if (groupBy === "Boomer Score") {
        const score = Number(prospect["Boomer Score"]) || 0;
        if (score >= 75) groupKey = "High Priority (75-100)";
        else if (score >= 50) groupKey = "Medium Priority (50-74)";
        else groupKey = "Low Priority (0-49)";
      } else if (groupBy === "companyIndustry") {
        groupKey = prospect.companyIndustry || "Unknown";
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(prospect);
    });

    return groups;
  }, [sortedProspects, groupBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredProspects.length;
    const avgCombined = filteredProspects.reduce((sum, p) => 
      sum + (Number(p["Combined Acquisition Score"]) || 0), 0) / (total || 1);
    const avgBoomer = filteredProspects.reduce((sum, p) => 
      sum + (Number(p["Boomer Score"]) || 0), 0) / (total || 1);
    const avgBurnout = filteredProspects.reduce((sum, p) => 
      sum + (Number(p["Burnout Score"]) || 0), 0) / (total || 1);

    return {
      total,
      avgCombined: avgCombined.toFixed(1),
      avgBoomer: avgBoomer.toFixed(1),
      avgBurnout: avgBurnout.toFixed(1),
    };
  }, [filteredProspects]);

  const getScoreColor = (score: number | string) => {
    const num = Number(score) || 0;
    if (num >= 70) return "text-green-400";
    if (num >= 50) return "text-yellow-400";
    if (num >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBadgeVariant = (score: number | string): "default" | "secondary" | "destructive" | "outline" => {
    const num = Number(score) || 0;
    if (num >= 70) return "default";
    if (num >= 50) return "secondary";
    return "outline";
  };

  const setRating = (prospectId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [prospectId]: rating }));
  };

  const exportToCSV = () => {
    const headers = Array.from(visibleColumns).filter(col => col !== "rating");
    const csvContent = [
      headers.join(","),
      ...sortedProspects.map(prospect => 
        headers.map(header => {
          const value = prospect[header as keyof Prospect];
          return typeof value === "string" && value.includes(",") 
            ? `"${value}"` 
            : value;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ma-prospects.csv";
    a.click();
  };

  const activeFilterCount = selectedIndustries.length + 
    (scoreFilters.combinedMin > 0 || scoreFilters.combinedMax < 100 ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading prospects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">M&A Prospects Database</h1>
                <p className="text-sm text-slate-400">Jimmy's Acquisition Targets</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                Live Data
              </Badge>
              <span className="text-slate-400 text-sm">{stats.total.toLocaleString()} Companies</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Prospects</p>
                <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Acquisition Score</p>
                <p className="text-3xl font-bold text-white">{stats.avgCombined}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Boomer Score</p>
                <p className="text-3xl font-bold text-white">{stats.avgBoomer}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Burnout Score</p>
                <p className="text-3xl font-bold text-white">{stats.avgBurnout}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <Flame className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search companies, contacts, or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-blue-500">{activeFilterCount}</Badge>
            )}
          </Button>

          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="Combined Acquisition Score">Acquisition Score</SelectItem>
              <SelectItem value="Boomer Score">Boomer Score</SelectItem>
              <SelectItem value="companyIndustry">Industry</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedIndustries([]);
                setScoreFilters({
                  combinedMin: 0,
                  combinedMax: 100,
                  boomerMin: 0,
                  boomerMax: 100,
                  burnoutMin: 0,
                  burnoutMax: 100,
                });
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}

          <Button
            variant="outline"
            onClick={exportToCSV}
            className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800">
                <Columns3 className="h-4 w-4 mr-2" />
                Columns
                <Badge className="ml-2 bg-blue-500">{visibleColumns.size}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
              <DropdownMenuLabel className="text-slate-400">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              {[
                "rating",
                "Combined Acquisition Score",
                "Company Name",
                "fullName",
                "linkedinJobTitle",
                "companyIndustry",
                "Boomer Score",
                "Burnout Score",
                "Industry Hotness Score",
                "Contact Accessibility Score",
                "Education Pedigree Score",
                "Serial Entrepreneur Score",
                "Company Maturity Score",
                "Estimated Contact Age",
                "Years in Current Role",
                "Total ALL Contacts",
              ].map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={visibleColumns.has(column)}
                  onCheckedChange={(checked) => {
                    const newVisible = new Set(visibleColumns);
                    if (checked) {
                      newVisible.add(column);
                    } else {
                      newVisible.delete(column);
                    }
                    setVisibleColumns(newVisible);
                  }}
                  className="text-white"
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Industries</label>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                  {industries.slice(0, 20).map((industry) => (
                    <label key={industry} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIndustries([...selectedIndustries, industry]);
                          } else {
                            setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
                          }
                        }}
                        className="rounded border-slate-600"
                      />
                      {industry}
                    </label>
                  ))}
                </div>
              </div>

              {/* Score Filters */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Combined Score: {scoreFilters.combinedMin} - {scoreFilters.combinedMax}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.combinedMin}
                      onChange={(e) => setScoreFilters({...scoreFilters, combinedMin: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.combinedMax}
                      onChange={(e) => setScoreFilters({...scoreFilters, combinedMax: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Boomer Score: {scoreFilters.boomerMin} - {scoreFilters.boomerMax}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.boomerMin}
                      onChange={(e) => setScoreFilters({...scoreFilters, boomerMin: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.boomerMax}
                      onChange={(e) => setScoreFilters({...scoreFilters, boomerMax: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Burnout Score: {scoreFilters.burnoutMin} - {scoreFilters.burnoutMax}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.burnoutMin}
                      onChange={(e) => setScoreFilters({...scoreFilters, burnoutMin: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFilters.burnoutMax}
                      onChange={(e) => setScoreFilters({...scoreFilters, burnoutMax: Number(e.target.value)})}
                      className="bg-slate-950/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{sortedProspects.length.toLocaleString()}</span> of{" "}
            <span className="text-white font-medium">{prospects.length.toLocaleString()}</span> prospects
          </p>
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{visibleColumns.size}</span> columns
          </p>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {Object.entries(groupedProspects).map(([groupName, groupProspects]) => (
              <div key={groupName}>
                {groupBy !== "none" && (
                  <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-white">
                      {groupName} <span className="text-slate-400">({groupProspects.length})</span>
                    </h3>
                  </div>
                )}
                
                <table className="w-full">
                  <thead className="bg-slate-800/30 sticky top-0">
                    <tr>
                      {visibleColumns.has("rating") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          My Rating
                        </th>
                      )}
                      {visibleColumns.has("Combined Acquisition Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Score
                        </th>
                      )}
                      {visibleColumns.has("Company Name") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Company
                        </th>
                      )}
                      {visibleColumns.has("fullName") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Contact
                        </th>
                      )}
                      {visibleColumns.has("linkedinJobTitle") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Title
                        </th>
                      )}
                      {visibleColumns.has("companyIndustry") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Industry
                        </th>
                      )}
                      {visibleColumns.has("Boomer Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Boomer
                        </th>
                      )}
                      {visibleColumns.has("Burnout Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Burnout
                        </th>
                      )}
                      {visibleColumns.has("Industry Hotness Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Industry
                        </th>
                      )}
                      {visibleColumns.has("Contact Accessibility Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Access
                        </th>
                      )}
                      {visibleColumns.has("Education Pedigree Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Education
                        </th>
                      )}
                      {visibleColumns.has("Serial Entrepreneur Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Entrepreneur
                        </th>
                      )}
                      {visibleColumns.has("Company Maturity Score") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Maturity
                        </th>
                      )}
                      {visibleColumns.has("Estimated Contact Age") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Age
                        </th>
                      )}
                      {visibleColumns.has("Years in Current Role") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Years
                        </th>
                      )}
                      {visibleColumns.has("Total ALL Contacts") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Contacts
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {groupProspects.map((prospect, idx) => {
                      const prospectId = `${prospect.fullName}-${prospect["Company Name"]}`;
                      const rating = ratings[prospectId] || 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          {visibleColumns.has("rating") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setRating(prospectId, star)}
                                    className="hover:scale-110 transition-transform"
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        star <= rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-slate-600"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </td>
                          )}
                          {visibleColumns.has("Combined Acquisition Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getScoreBadgeVariant(prospect["Combined Acquisition Score"])}>
                                {Number(prospect["Combined Acquisition Score"] || 0).toFixed(1)}
                              </Badge>
                            </td>
                          )}
                          {visibleColumns.has("Company Name") && (
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <a
                                  href={prospect["Company LinkedIn URL"] || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white font-medium hover:text-blue-400 transition-colors"
                                >
                                  {prospect["Company Name"]}
                                </a>
                                <span className="text-xs text-slate-500">
                                  {prospect["Decision Maker Status 1"]}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has("fullName") && (
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              {prospect.fullName}
                            </td>
                          )}
                          {visibleColumns.has("linkedinJobTitle") && (
                            <td className="px-6 py-4 text-slate-300">
                              {prospect.linkedinJobTitle}
                            </td>
                          )}
                          {visibleColumns.has("companyIndustry") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="text-slate-300 border-slate-600">
                                {prospect.companyIndustry}
                              </Badge>
                            </td>
                          )}
                          {visibleColumns.has("Boomer Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Boomer Score"])}>
                                {Number(prospect["Boomer Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Burnout Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Burnout Score"])}>
                                {Number(prospect["Burnout Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Industry Hotness Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Industry Hotness Score"])}>
                                {Number(prospect["Industry Hotness Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Contact Accessibility Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Contact Accessibility Score"])}>
                                {Number(prospect["Contact Accessibility Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Education Pedigree Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Education Pedigree Score"])}>
                                {Number(prospect["Education Pedigree Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Serial Entrepreneur Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Serial Entrepreneur Score"])}>
                                {Number(prospect["Serial Entrepreneur Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Company Maturity Score") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getScoreColor(prospect["Company Maturity Score"])}>
                                {Number(prospect["Company Maturity Score"] || 0).toFixed(0)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has("Estimated Contact Age") && (
                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                              {prospect["Estimated Contact Age"] || "-"}
                            </td>
                          )}
                          {visibleColumns.has("Years in Current Role") && (
                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                              {prospect["Years in Current Role"] || "-"}
                            </td>
                          )}
                          {visibleColumns.has("Total ALL Contacts") && (
                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                              {prospect["Total ALL Contacts"] || 0}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={prospect.linkedinProfileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 mt-12">
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            © 2025 M&A Prospects Database. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Made with Manus
          </p>
        </div>
      </footer>
    </div>
  );
}

