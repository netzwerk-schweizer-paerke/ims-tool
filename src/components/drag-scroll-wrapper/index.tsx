'use client'

import React, { ReactNode, useEffect, useRef, useState } from 'react'

interface DragScrollWrapperProps {
  children: ReactNode
  className?: string
  direction?: ScrollDirection
  scrollSpeed?: number
  showScrollbar?: boolean
}

type ScrollDirection = 'both' | 'horizontal' | 'vertical'

/**
 * A wrapper component that enables drag-to-scroll functionality
 * Click and drag to scroll through the content in the specified direction
 */
export const DragScrollWrapper = ({
  children,
  className = '',
  direction = 'horizontal',
  scrollSpeed = 1,
  showScrollbar = false,
}: DragScrollWrapperProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [momentumX, setMomentumX] = useState(0)
  const [momentumY, setMomentumY] = useState(0)
  const animationRef = useRef<number>(0)

  const canScrollHorizontal = direction === 'horizontal' || direction === 'both'
  const canScrollVertical = direction === 'vertical' || direction === 'both'

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return

    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setStartY(e.pageY - scrollRef.current.offsetTop)
    setScrollLeft(scrollRef.current.scrollLeft)
    setScrollTop(scrollRef.current.scrollTop)
    setMomentumX(0)
    setMomentumY(0)

    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Change cursor
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.userSelect = 'none'
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (!isDragging) return
    handleMouseUp()
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (!scrollRef.current) return

    setIsDragging(false)
    scrollRef.current.style.cursor = 'grab'
    scrollRef.current.style.removeProperty('user-select')

    // Apply momentum scrolling
    if (Math.abs(momentumX) > 0.5 || Math.abs(momentumY) > 0.5) {
      applyMomentum(momentumX, momentumY)
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return

    e.preventDefault()

    if (canScrollHorizontal) {
      const x = e.pageX - scrollRef.current.offsetLeft
      const walkX = (x - startX) * scrollSpeed
      const newScrollLeft = scrollLeft - walkX
      setMomentumX(walkX)
      scrollRef.current.scrollLeft = newScrollLeft
    }

    if (canScrollVertical) {
      const y = e.pageY - scrollRef.current.offsetTop
      const walkY = (y - startY) * scrollSpeed
      const newScrollTop = scrollTop - walkY
      setMomentumY(walkY)
      scrollRef.current.scrollTop = newScrollTop
    }
  }

  // Apply momentum after drag ends
  const applyMomentum = (initialMomentumX: number, initialMomentumY: number) => {
    let currentMomentumX = initialMomentumX
    let currentMomentumY = initialMomentumY

    const animate = () => {
      if (!scrollRef.current) return

      let shouldContinue = false

      if (canScrollHorizontal && Math.abs(currentMomentumX) > 0.5) {
        scrollRef.current.scrollLeft -= currentMomentumX
        currentMomentumX *= 0.95 // Damping factor
        shouldContinue = true
      }

      if (canScrollVertical && Math.abs(currentMomentumY) > 0.5) {
        scrollRef.current.scrollTop -= currentMomentumY
        currentMomentumY *= 0.95 // Damping factor
        shouldContinue = true
      }

      if (shouldContinue) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return

    const touch = e.touches[0]
    setIsDragging(true)
    setStartX(touch.pageX - scrollRef.current.offsetLeft)
    setStartY(touch.pageY - scrollRef.current.offsetTop)
    setScrollLeft(scrollRef.current.scrollLeft)
    setScrollTop(scrollRef.current.scrollTop)
    setMomentumX(0)
    setMomentumY(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return

    const touch = e.touches[0]

    if (canScrollHorizontal) {
      const x = touch.pageX - scrollRef.current.offsetLeft
      const walkX = (x - startX) * scrollSpeed
      const newScrollLeft = scrollLeft - walkX
      setMomentumX(walkX)
      scrollRef.current.scrollLeft = newScrollLeft
    }

    if (canScrollVertical) {
      const y = touch.pageY - scrollRef.current.offsetTop
      const walkY = (y - startY) * scrollSpeed
      const newScrollTop = scrollTop - walkY
      setMomentumY(walkY)
      scrollRef.current.scrollTop = newScrollTop
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    if (Math.abs(momentumX) > 0.5 || Math.abs(momentumY) > 0.5) {
      applyMomentum(momentumX, momentumY)
    }
  }

  // Prevent default drag behavior on images and links
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Set initial cursor style
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab'
    }
  }, [])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Determine overflow settings based on direction
  const getOverflowStyle = () => {
    switch (direction) {
      case 'both': {
        return {
          overflow: 'auto' as const,
        }
      }
      case 'horizontal': {
        return {
          overflowX: 'auto' as const,
          overflowY: 'hidden' as const,
        }
      }
      case 'vertical': {
        return {
          overflowX: 'hidden' as const,
          overflowY: 'auto' as const,
        }
      }
      default: {
        return {
          overflow: 'auto' as const,
        }
      }
    }
  }

  // Combine classes for scrollbar visibility based on direction
  const getScrollbarClass = () => {
    if (showScrollbar) return ''

    switch (direction) {
      case 'both': {
        return 'scrollbar-hide'
      }
      case 'horizontal': {
        return 'scrollbar-hide-horizontal'
      }
      case 'vertical': {
        return 'scrollbar-hide-vertical'
      }
      default: {
        return 'scrollbar-hide'
      }
    }
  }

  return (
    <div
      className={`${className} ${getScrollbarClass()} ${isDragging ? 'is-dragging' : ''}`}
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={scrollRef}
      style={{
        ...getOverflowStyle(),
        position: 'relative',
      }}>
      {children}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .scrollbar-hide-horizontal {
          -ms-overflow-style: -ms-autohiding-scrollbar; /* IE and Edge */
        }
        .scrollbar-hide-horizontal::-webkit-scrollbar:horizontal {
          display: none; /* Chrome, Safari and Opera */
        }

        .scrollbar-hide-vertical {
          -ms-overflow-style: -ms-autohiding-scrollbar; /* IE and Edge */
        }
        .scrollbar-hide-vertical::-webkit-scrollbar:vertical {
          display: none; /* Chrome, Safari and Opera */
        }

        .is-dragging {
          scroll-behavior: auto !important;
        }
      `}</style>
    </div>
  )
}

// Export a typed version for better IDE support
export default DragScrollWrapper
