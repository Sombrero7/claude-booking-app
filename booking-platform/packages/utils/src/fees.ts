/**
 * Fee calculation utility functions
 */

/**
 * Calculate platform fee based on amount
 */
export const calculatePlatformFee = (amount: number): number => {
  if (amount < 10) {
    return 2;
  } else if (amount < 25) {
    return 3;
  } else {
    return Math.max(4, amount * 0.05); // 5% with $4 minimum
  }
};

/**
 * Calculate revenue splits for collaborators
 */
export const calculateCollaboratorSplits = (
  totalAmount: number,
  collaborators: Array<{
    creatorId: string;
    paymentType: 'percentage' | 'flat';
    paymentValue: number;
  }>
): Array<{ creatorId: string; amount: number }> => {
  return collaborators.map(collaborator => {
    let amount: number;
    
    if (collaborator.paymentType === 'percentage') {
      amount = (totalAmount * collaborator.paymentValue) / 100;
    } else {
      amount = collaborator.paymentValue;
    }
    
    return {
      creatorId: collaborator.creatorId,
      amount
    };
  });
};