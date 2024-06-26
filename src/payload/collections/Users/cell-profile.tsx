import React from 'react';
import { logger } from '@/lib/logger';

export const UserCustomCellProfile: React.FC<any> = (props) => {
  const { field, colIndex, collection, cellData, rowData } = props;
  logger.info(props);

  return <span>{cellData}</span>;
};
