import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  FileText, 
  Upload, 
  Calendar,
  TrendingUp,
  Clock
} from "lucide-react"

interface ResponseStatsProps {
  stats: {
    total_responses: number
    unique_users: number
    latest_response: string
    total_files: number
    today_responses: number
  }
  previousStats?: {
    total_responses: number
    unique_users: number
    total_files: number
  }
}

export function ResponseStats({ stats, previousStats }: ResponseStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600"
    if (growth < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return "↗"
    if (growth < 0) return "↘"
    return "→"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Responses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_responses.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {stats.today_responses} today
            </Badge>
            {previousStats && (
              <span className={`text-xs ${getGrowthColor(calculateGrowth(stats.total_responses, previousStats.total_responses))}`}>
                {getGrowthIcon(calculateGrowth(stats.total_responses, previousStats.total_responses))}
                {Math.abs(calculateGrowth(stats.total_responses, previousStats.total_responses)).toFixed(1)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unique Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unique_users.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Active sessions
            </Badge>
            {previousStats && (
              <span className={`text-xs ${getGrowthColor(calculateGrowth(stats.unique_users, previousStats.unique_users))}`}>
                {getGrowthIcon(calculateGrowth(stats.unique_users, previousStats.unique_users))}
                {Math.abs(calculateGrowth(stats.unique_users, previousStats.unique_users)).toFixed(1)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Uploads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">File Uploads</CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_files.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Total files
            </Badge>
            {previousStats && (
              <span className={`text-xs ${getGrowthColor(calculateGrowth(stats.total_files, previousStats.total_files))}`}>
                {getGrowthIcon(calculateGrowth(stats.total_files, previousStats.total_files))}
                {Math.abs(calculateGrowth(stats.total_files, previousStats.total_files)).toFixed(1)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Activity</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {stats.latest_response ? formatDate(stats.latest_response) : 'No activity'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Last response
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 