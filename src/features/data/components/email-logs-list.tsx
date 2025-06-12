import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle, Calendar, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const EmailLogsList = () => {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  // Fetch logs with filtering
  const { data: logs, isLoading } = useQuery({
    queryKey: ['/api/email/logs', page, filterStatus, filterDate, searchQuery],
    queryFn: async () => {
      let url = `/api/email/logs?page=${page}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterDate) url += `&date=${format(filterDate, 'yyyy-MM-dd')}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    keepPreviousData: true,
  });
  
  // Handle view log details
  const handleViewLog = (log: any) => {
    setSelectedLog(log);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus(null);
    setFilterDate(null);
    setSearchQuery('');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                History of emails sent from the system
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipients or subject..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={filterDate || undefined}
                    onSelect={setFilterDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={filterStatus || ''} onValueChange={(value) => setFilterStatus(value || null)}>
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterStatus || 'Status'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              {(filterStatus || filterDate || searchQuery) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent By</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.sentAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'sent' ? 'success' : 'destructive'}>
                          {log.status === 'sent' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.recipients.split(',').length > 1 
                          ? `${log.recipients.split(',')[0]} +${log.recipients.split(',').length - 1} more`
                          : log.recipients
                        }
                      </TableCell>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>{log.sentByName || `User #${log.sentBy}`}</TableCell>
                      <TableCell>{log.relatedTo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewLog(log)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {logs.length} of {logs.totalCount || 'many'} logs
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!logs.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No email logs found.
              {(filterStatus || filterDate || searchQuery) && (
                <div className="mt-2">
                  <Button variant="link" onClick={clearFilters}>
                    Clear filters to see all logs
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Email Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Sent on {selectedLog && format(new Date(selectedLog.sentAt), 'MMMM d, yyyy HH:mm:ss')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-1">
                    <Badge variant={selectedLog.status === 'sent' ? 'success' : 'destructive'}>
                      {selectedLog.status === 'sent' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Message ID</h4>
                  <p className="text-sm">{selectedLog.messageId || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Recipients</h4>
                <p className="text-sm">{selectedLog.recipients}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                <p className="text-sm">{selectedLog.subject}</p>
              </div>
              
              {selectedLog.body && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Body</h4>
                  <div className="mt-1 p-4 border rounded-md bg-muted/20 overflow-auto max-h-60">
                    <pre className="text-sm whitespace-pre-wrap">{selectedLog.body}</pre>
                  </div>
                </div>
              )}
              
              {selectedLog.attachments && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Attachments</h4>
                  <ul className="list-disc list-inside text-sm pl-2 mt-1">
                    {JSON.parse(selectedLog.attachments).map((attachment: string, index: number) => (
                      <li key={index}>{attachment.split('/').pop()}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedLog.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-red-500">Error Message</h4>
                  <div className="mt-1 p-4 border border-red-200 rounded-md bg-red-50 overflow-auto max-h-40">
                    <pre className="text-sm text-red-800 whitespace-pre-wrap">{selectedLog.errorMessage}</pre>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Sent By</h4>
                  <p className="text-sm">{selectedLog.sentByName || `User #${selectedLog.sentBy}`}</p>
                </div>
                {selectedLog.relatedTo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Related To</h4>
                    <p className="text-sm">{selectedLog.relatedTo}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailLogsList;