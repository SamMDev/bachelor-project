
export interface GdprAudit {
  id: number;
  message: string;
  created: Date;
  childAudits: GdprAudit[];
}
