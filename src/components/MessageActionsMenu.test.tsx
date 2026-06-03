import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MessageActionsMenu } from './MessageActionsMenu'

describe('MessageActionsMenu', () => {
  it('offers copy, PDF, and Word export actions', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    const onExportPdf = vi.fn()
    const onExportWord = vi.fn()

    render(
      <MessageActionsMenu
        messageId="msg-1"
        text="Sample assistant reply"
        onCopy={ onCopy }
        onExportPdf={ onExportPdf }
        onExportWord={ onExportWord }
      />,
    )

    await user.click(screen.getByRole('button', { name: 'More options' }))

    expect(screen.getByRole('menuitem', { name: /copy/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /export as pdf/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /export as word/i })).toBeTruthy()

    await user.click(screen.getByRole('menuitem', { name: /export as pdf/i }))
    expect(onExportPdf).toHaveBeenCalledWith('Sample assistant reply')
  })
})
