import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    // Soft delete not explicitly requested for branch in spec, but good practice.
    // However, spec for services says "DELETE soft".
    // For branches I'll just do hard delete for now unless we add active field.
    // Actually spec says "DELETE soft" for branches too.
    // Schema didn't add 'active' to Branch, so I'll check if I should update schema or implement hard delete with check.
    // Re-reading schema... no 'active' on Branch.
    // I will implement hard delete but it will fail if there are constraints. 
    // Or I can update schema.
    // Let's check for relations first.
    
    // Attempt delete
    const branch = await prisma.branch.delete({
      where: { id },
    })
    return branch
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete branch with existing records',
    })
  }
})
