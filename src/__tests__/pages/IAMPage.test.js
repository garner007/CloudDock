import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IAMPage from '../../pages/IAMPage';

jest.mock('@aws-sdk/client-iam', () => ({
  IAMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Users: [],
      Roles: [],
      Policies: [],
    }),
    destroy: jest.fn(),
  })),
  ListUsersCommand: jest.fn(),
  ListRolesCommand: jest.fn(),
  ListPoliciesCommand: jest.fn(),
  CreateUserCommand: jest.fn(),
  DeleteUserCommand: jest.fn(),
  DeleteRoleCommand: jest.fn(),
}));

describe('IAMPage', () => {
  test('renders page title', async () => {
    render(<IAMPage showNotification={jest.fn()} />);
    expect(screen.getByText('IAM')).toBeInTheDocument();
  });

  test('shows tabs for Users, Roles, Policies', async () => {
    render(<IAMPage showNotification={jest.fn()} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Policies')).toBeInTheDocument();
  });
});
