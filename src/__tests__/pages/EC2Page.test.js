import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EC2Page from '../../pages/EC2Page';

jest.mock('@aws-sdk/client-ec2', () => ({
  EC2Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Reservations: [],
      KeyPairs: [],
      SecurityGroups: [],
      Vpcs: [],
    }),
    destroy: jest.fn(),
  })),
  DescribeInstancesCommand: jest.fn(),
  DescribeKeyPairsCommand: jest.fn(),
  DescribeSecurityGroupsCommand: jest.fn(),
  DescribeVpcsCommand: jest.fn(),
  CreateKeyPairCommand: jest.fn(),
  DeleteKeyPairCommand: jest.fn(),
  TerminateInstancesCommand: jest.fn(),
}));

describe('EC2Page', () => {
  test('renders page title', async () => {
    render(<EC2Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('EC2')).toBeInTheDocument();
    });
  });

  test('shows tabs for Instances, Key Pairs, Security Groups, VPCs', async () => {
    render(<EC2Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Instances (0)')).toBeInTheDocument();
      expect(screen.getByText('Key Pairs (0)')).toBeInTheDocument();
      expect(screen.getByText('Security Groups (0)')).toBeInTheDocument();
      expect(screen.getByText('VPCs (0)')).toBeInTheDocument();
    });
  });
});
