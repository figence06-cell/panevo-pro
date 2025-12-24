import React from 'react';
import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ 
  message = 'Site bakımda. Lütfen daha sonra tekrar deneyin.' 
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center">
          <Wrench className="h-10 w-10 text-warning" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Site Bakımda</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            En kısa sürede tekrar hizmetinizde olacağız.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
