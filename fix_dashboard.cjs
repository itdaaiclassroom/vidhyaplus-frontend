const fs = require('fs');
const f = 'src/pages/admin/ModernAdminDashboard.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add Sessions card after Sections card
const sectionsEnd = `                </Card>\r\n             </div>\r\n\r\n             <Tabs defaultValue="school-teachers" className="space-y-6">`;
const sessionsCardInsert = `                </Card>\r\n                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">\r\n                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sessions</p>\r\n                  <p className="text-2xl font-bold text-slate-800">{data.liveSessions.filter(ls => classes.filter(c => c.schoolId === viewingSchool?.id).map(c => c.id).includes(ls.classId)).length}</p>\r\n                </Card>\r\n             </div>\r\n\r\n             <Tabs defaultValue="school-teachers" className="space-y-6">`;

const idx1 = c.lastIndexOf(sectionsEnd);
if (idx1 === -1) { console.log('ERROR: Sessions card anchor not found'); process.exit(1); }
c = c.substring(0, idx1) + sessionsCardInsert + c.substring(idx1 + sectionsEnd.length);
console.log('1. Sessions card added');

// 2. Add Sessions tab trigger
const tabsOld = `<TabsTrigger value="school-students" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Students</TabsTrigger>\r\n                </TabsList>`;
const tabsNew = `<TabsTrigger value="school-students" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Students</TabsTrigger>\r\n                  <TabsTrigger value="school-sessions" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Sessions</TabsTrigger>\r\n                </TabsList>`;

if (!c.includes(tabsOld)) { console.log('ERROR: Tab trigger anchor not found'); process.exit(1); }
c = c.replace(tabsOld, tabsNew);
console.log('2. Sessions tab trigger added');

// 3. Add Sessions tab content before </Tabs> closing in School Details
const tabsClose = `                </TabsContent>\r\n             </Tabs>\r\n          </div>\r\n          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">`;
const tabsCloseNew = `                </TabsContent>\r\n\r\n                <TabsContent value="school-sessions">\r\n                  {viewingSchool && <SessionAnalytics schoolId={viewingSchool.id} />}\r\n                </TabsContent>\r\n             </Tabs>\r\n          </div>\r\n          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">`;

if (!c.includes(tabsClose)) { console.log('ERROR: Tabs close anchor not found'); process.exit(1); }
c = c.replace(tabsClose, tabsCloseNew);
console.log('3. Sessions tab content added');

fs.writeFileSync(f, c);
console.log('All changes applied successfully!');
