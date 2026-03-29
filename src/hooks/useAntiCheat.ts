import { useEffect, useState } from 'react'
import { useQuizRunnerStore } from '@/store/useQuizRunnerStore'

export function useAntiCheat(
  submissionId: string,
  focusMode: boolean,
  onForceSubmit: () => void
) {
  const [warningVisible, setWarningVisible] = useState(false)
  const incrementCheatCount = useQuizRunnerStore(state => state.incrementCheatCount)
  const cheatCount = useQuizRunnerStore(state => state.cheatCount)

  useEffect(() => {
    if (!focusMode) return

    const handleViolation = () => {
      if (warningVisible) return 
      
      incrementCheatCount(submissionId)
      
      const newCount = useQuizRunnerStore.getState().cheatCount
      if (newCount >= 3) {
        onForceSubmit()
      } else {
        setWarningVisible(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation()
      }
    }

    const handleBlur = () => {
      handleViolation()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [focusMode, submissionId, warningVisible, onForceSubmit, incrementCheatCount])

  return {
    warningVisible,
    dismissWarning: () => {
      setWarningVisible(false)
      try {
         document.documentElement.requestFullscreen?.()
      } catch(e) {}
    },
    cheatCount
  }
}
