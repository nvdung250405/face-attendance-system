import React from 'react'
import { ShiftCatalogTable, type ShiftCatalogTableProps } from './ShiftCatalogTable'

export type ShiftManagementTableProps = ShiftCatalogTableProps

export const ShiftManagementTable: React.FC<ShiftManagementTableProps> = (props) => {
  return <ShiftCatalogTable {...props} />
}

export default ShiftManagementTable
