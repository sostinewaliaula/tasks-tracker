import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import fs from 'fs';
import path from 'path';

export interface TaskData {
  id: number;
  title: string;
  description?: string;
  deadline?: Date;
  priority?: string;
  status?: string;
  blockerReason?: string;
  createdBy?: string;
  subtasks?: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    deadline: Date;
    blockerReason?: string;
  }>;
}

export interface EmailAttachmentData {
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'task_deadline' | 'daily_progress' | 'weekly_report' | 'manager_summary' | 'general';
  userData: {
    name: string;
    email: string;
    department?: string;
  };
  taskData?: TaskData;
  progressData?: {
    completed: number;
    pending: number;
    blockers: number;
    tasks: Array<{
      title: string;
      deadline: Date;
      status: string;
      subtasks?: Array<{
        title: string;
        status: string;
        priority: string;
        deadline: Date;
        blockerReason?: string;
      }>;
    }>;
  };
  teamData?: Array<{
    name: string;
    completedTasks: number;
    tasks: Array<{
      title: string;
      deadline: Date;
      subtasks?: Array<{
        title: string;
        status: string;
        priority: string;
        deadline: Date;
      }>;
    }>;
  }>;
  overdueData?: Array<{
    title: string;
    deadline: Date;
    status: string;
    subtasks?: Array<{
      title: string;
      status: string;
      priority: string;
      deadline: Date;
    }>;
  }>;
}

export async function generateWordAttachment(data: EmailAttachmentData): Promise<Buffer> {
  try {
    // Load logo image
    let logoBuffer = null;
    try {
      const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (error) {
      console.warn('Could not load logo for Word attachment:', error);
    }

    // Calculate statistics for progress reports
    let completedTasks = 0;
    let overdueTasks = 0;
    let carriedOverTasks = 0;
    let completionRate = 0;

    if (data.progressData) {
      completedTasks = data.progressData.completed;
      overdueTasks = data.progressData.tasks.filter(t => 
        t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now()
      ).length;
      carriedOverTasks = data.progressData.tasks.filter(t => 
        t.status === 'blocker' && t.subtasks?.some(st => st.blockerReason)
      ).length;
      completionRate = data.progressData.tasks.length > 0 ? 
        Math.round((completedTasks / data.progressData.tasks.length) * 100) : 0;
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Company Header with Logo (only if logo loaded successfully)
          ...(logoBuffer ? [new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: {
                  width: 100,
                  height: 60,
                },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          })] : []),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Caava Group",
                bold: true,
                size: 28,
                color: "2e9d74"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          // Title based on notification type
          new Paragraph({
            children: [
              new TextRun({
                text: getDocumentTitle(data.type),
                bold: true,
                size: 32,
                color: "2e9d74"
              })
            ],
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            spacing: { before: 100, after: 200 }
          }),
          
          // Generation date
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${new Date().toLocaleDateString()}`,
                size: 20
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          
          // Recipient info
          new Paragraph({
            children: [
              new TextRun({
                text: `For: ${data.userData.name}`,
                size: 20
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          
          ...(data.userData.department ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Department: ${data.userData.department}`,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ] : []),
          
          // Description
          new Paragraph({
            children: [
              new TextRun({
                text: getDocumentDescription(data.type),
                size: 20
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          // Content based on notification type
          ...generateContentForType(data),
        ]
      }]
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error('Error generating Word attachment:', error);
    throw error;
  }
}

function getDocumentTitle(type: string): string {
  switch (type) {
    case 'task_assigned':
      return 'Task Assignment Notification';
    case 'task_completed':
      return 'Task Completion Report';
    case 'task_overdue':
      return 'Overdue Tasks Alert';
    case 'task_deadline':
      return 'Deadline Reminder';
    case 'daily_progress':
      return 'Daily Progress Report';
    case 'weekly_report':
      return 'Weekly Progress Report';
    case 'manager_summary':
      return 'Team Summary Report';
    default:
      return 'Task Management Notification';
  }
}

function getDocumentDescription(type: string): string {
  switch (type) {
    case 'task_assigned':
      return 'New task assignment details and requirements';
    case 'task_completed':
      return 'Task completion confirmation and details';
    case 'task_overdue':
      return 'Overdue tasks requiring immediate attention';
    case 'task_deadline':
      return 'Upcoming deadline reminder and task details';
    case 'daily_progress':
      return 'Daily task progress summary and statistics';
    case 'weekly_report':
      return 'Weekly task progress summary and analytics';
    case 'manager_summary':
      return 'Team performance summary and completed tasks';
    default:
      return 'Task management system notification';
  }
}

function generateContentForType(data: EmailAttachmentData): Paragraph[] {
  switch (data.type) {
    case 'task_assigned':
      return generateTaskAssignedContent(data);
    case 'task_completed':
      return generateTaskCompletedContent(data);
    case 'task_overdue':
      return generateTaskOverdueContent(data);
    case 'task_deadline':
      return generateTaskDeadlineContent(data);
    case 'daily_progress':
      return generateDailyProgressContent(data);
    case 'weekly_report':
      return generateWeeklyReportContent(data);
    case 'manager_summary':
      return generateManagerSummaryContent(data);
    default:
      return generateGeneralContent(data);
  }
}

function generateTaskAssignedContent(data: EmailAttachmentData): Paragraph[] {
  const task = data.taskData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Task Details",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Task Title: ${task.title}`,
          bold: true,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    ...(task.description ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Description: ${task.description}`,
            size: 20
          })
        ],
        spacing: { after: 50 }
      })
    ] : []),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Priority: ${task.priority || 'Not specified'}`,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}`,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Created By: ${task.createdBy || 'System'}`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    }),
    
    // Subtasks
    ...(task.subtasks && task.subtasks.length > 0 ? [
      new Paragraph({
        children: [
          new TextRun({
            text: "Subtasks",
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }),
      
      ...task.subtasks.map(subtask => [
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${subtask.title}`,
              bold: true,
              size: 20
            })
          ],
          spacing: { before: 100, after: 50 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `  Status: ${subtask.status} | Priority: ${subtask.priority} | Deadline: ${new Date(subtask.deadline).toLocaleDateString()}`,
              size: 18
            })
          ],
          spacing: { after: 30 }
        }),
        
        ...(subtask.blockerReason ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `  Blocker Reason: ${subtask.blockerReason}`,
                size: 18,
                color: 'FF0000',
                italics: true
              })
            ],
            spacing: { after: 30 }
          })
        ] : [])
      ]).flat()
    ] : [])
  ];
}

function generateTaskCompletedContent(data: EmailAttachmentData): Paragraph[] {
  const task = data.taskData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Completed Task Details",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Task: ${task.title}`,
          bold: true,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Status: Completed`,
          size: 20,
          color: '008000',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    ...(task.description ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Description: ${task.description}`,
            size: 20
          })
        ],
        spacing: { after: 50 }
      })
    ] : []),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Priority: ${task.priority || 'Not specified'}`,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Completion Date: ${new Date().toLocaleDateString()}`,
          size: 20,
          bold: true
        })
      ],
      spacing: { after: 100 }
    })
  ];
}

function generateTaskOverdueContent(data: EmailAttachmentData): Paragraph[] {
  const overdue = data.overdueData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Overdue Tasks Alert",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that require immediate attention.`,
          size: 20,
          color: 'FF0000',
          bold: true
        })
      ],
      spacing: { after: 100 }
    }),
    
    ...overdue.map(task => [
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${task.title}`,
            bold: true,
            size: 20,
            color: 'FF0000'
          })
        ],
        spacing: { before: 100, after: 50 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `  Status: ${task.status} | Original Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
            size: 18
          })
        ],
        spacing: { after: 30 }
      }),
      
      ...(task.subtasks && task.subtasks.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `  Subtasks:`,
              bold: true,
              size: 18
            })
          ],
          spacing: { after: 20 }
        }),
        ...task.subtasks.map(subtask =>
          new Paragraph({
            children: [
              new TextRun({
                text: `    - ${subtask.title} (${subtask.status}, ${subtask.priority})`,
                size: 16
              })
            ],
            spacing: { after: 10 }
          })
        )
      ] : [])
    ]).flat()
  ];
}

function generateTaskDeadlineContent(data: EmailAttachmentData): Paragraph[] {
  const task = data.taskData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Deadline Reminder",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `You have a task deadline approaching!`,
          size: 20,
          color: 'FFA500',
          bold: true
        })
      ],
      spacing: { after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Task: ${task.title}`,
          bold: true,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    ...(task.description ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Description: ${task.description}`,
            size: 20
          })
        ],
        spacing: { after: 50 }
      })
    ] : []),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Priority: ${task.priority || 'Not specified'}`,
          size: 20
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}`,
          size: 20,
          color: 'FFA500',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Status: ${task.status || 'Not specified'}`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    })
  ];
}

function generateDailyProgressContent(data: EmailAttachmentData): Paragraph[] {
  const progress = data.progressData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Daily Progress Summary",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Completed: ${progress.completed}`,
          size: 20,
          color: '008000',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Pending: ${progress.pending}`,
          size: 20,
          color: 'FFA500',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Blocked: ${progress.blockers}`,
          size: 20,
          color: 'FF0000',
          bold: true
        })
      ],
      spacing: { after: 100 }
    }),
    
    // Task details
    ...(progress.tasks.length > 0 ? [
      new Paragraph({
        children: [
          new TextRun({
            text: "Task Details",
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }),
      
      ...progress.tasks.map(task => [
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${task.title}`,
              bold: true,
              size: 20
            })
          ],
          spacing: { before: 100, after: 50 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `  Status: ${task.status} | Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
              size: 18
            })
          ],
          spacing: { after: 30 }
        }),
        
        ...(task.subtasks && task.subtasks.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `  Subtasks:`,
                bold: true,
                size: 18
              })
            ],
            spacing: { after: 20 }
          }),
          ...task.subtasks.map(subtask =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `    - ${subtask.title} (${subtask.status}, ${subtask.priority})`,
                  size: 16
                })
              ],
              spacing: { after: 10 }
            })
          )
        ] : [])
      ]).flat()
    ] : [])
  ];
}

function generateWeeklyReportContent(data: EmailAttachmentData): Paragraph[] {
  const progress = data.progressData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Weekly Progress Report",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Week of ${new Date().toLocaleDateString()}`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Completed This Week: ${progress.completed}`,
          size: 20,
          color: '008000',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Pending: ${progress.pending}`,
          size: 20,
          color: 'FFA500',
          bold: true
        })
      ],
      spacing: { after: 50 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Tasks Blocked: ${progress.blockers}`,
          size: 20,
          color: 'FF0000',
          bold: true
        })
      ],
      spacing: { after: 100 }
    }),
    
    // Task details
    ...(progress.tasks.length > 0 ? [
      new Paragraph({
        children: [
          new TextRun({
            text: "This Week's Tasks",
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }),
      
      ...progress.tasks.map(task => [
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${task.title}`,
              bold: true,
              size: 20
            })
          ],
          spacing: { before: 100, after: 50 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `  Status: ${task.status} | Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
              size: 18
            })
          ],
          spacing: { after: 30 }
        }),
        
        ...(task.subtasks && task.subtasks.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `  Subtasks:`,
                bold: true,
                size: 18
              })
            ],
            spacing: { after: 20 }
          }),
          ...task.subtasks.map(subtask =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `    - ${subtask.title} (${subtask.status}, ${subtask.priority})`,
                  size: 16
                })
              ],
              spacing: { after: 10 }
            })
          )
        ] : [])
      ]).flat()
    ] : [])
  ];
}

function generateManagerSummaryContent(data: EmailAttachmentData): Paragraph[] {
  const team = data.teamData!;
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Team Summary Report",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Daily completed tasks summary for your team`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    }),
    
    ...team.map(member => [
      new Paragraph({
        children: [
          new TextRun({
            text: `Team Member: ${member.name}`,
            bold: true,
            size: 22
          })
        ],
        spacing: { before: 200, after: 50 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `Completed Tasks Today: ${member.completedTasks}`,
            size: 20,
            color: '008000',
            bold: true
          })
        ],
        spacing: { after: 50 }
      }),
      
      ...(member.tasks.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `Completed Tasks:`,
              bold: true,
              size: 20
            })
          ],
          spacing: { after: 50 }
        }),
        
        ...member.tasks.map(task => [
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${task.title}`,
                bold: true,
                size: 20
              })
            ],
            spacing: { before: 50, after: 30 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `  Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
                size: 18
              })
            ],
            spacing: { after: 30 }
          }),
          
          ...(task.subtasks && task.subtasks.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `  Subtasks:`,
                  bold: true,
                  size: 18
                })
              ],
              spacing: { after: 20 }
            }),
            ...task.subtasks.map(subtask =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `    - ${subtask.title} (${subtask.status}, ${subtask.priority})`,
                    size: 16
                  })
                ],
                spacing: { after: 10 }
              })
            )
          ] : [])
        ]).flat()
      ] : [
        new Paragraph({
          children: [
            new TextRun({
              text: `No completed tasks today.`,
              size: 18,
              italics: true
            })
          ],
          spacing: { after: 50 }
        })
      ])
    ]).flat()
  ];
}

function generateGeneralContent(data: EmailAttachmentData): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "General Notification",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `You have received a notification from Caava Group Task Management System.`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Please check your dashboard for more details.`,
          size: 20
        })
      ],
      spacing: { after: 100 }
    })
  ];
}
