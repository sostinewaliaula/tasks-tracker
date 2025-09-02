import { DEPARTMENTS } from './departments';

export type MockUser = {
  id: string;
  name: string;
  role: 'employee' | 'manager';
  department: string;
  email: string;
  avatar: string;
};

export const MOCK_USERS: MockUser[] = DEPARTMENTS.flatMap((dept, dIdx) => {
  const users: MockUser[] = [];
  users.push({
    id: `${dIdx + 1}-M`,
    name: `${dept} Manager`,
    role: 'manager',
    department: dept,
    email: `${dept.toLowerCase().replace(/\s+/g, '')}.manager@caava.com`,
    avatar: `https://randomuser.me/api/portraits/men/${(dIdx * 7) % 90}.jpg`
  });
  for (let i = 1; i <= 9; i++) {
    users.push({
      id: `${dIdx + 1}-E${i}`,
      name: `${dept} Employee ${i}`,
      role: 'employee',
      department: dept,
      email: `${dept.toLowerCase().replace(/\s+/g, '')}.emp${i}@caava.com`,
      avatar: `https://randomuser.me/api/portraits/women/${(dIdx * 11 + i) % 90}.jpg`
    });
  }
  return users;
});


