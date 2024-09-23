'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, RotateCcw, ArrowDown } from 'lucide-react'

// テトロミノに固有の番号を割り当てます
const TETROMINOS: { [key: string]: { shape: number[][]; color: string; id: number } } = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500', id: 1 },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500', id: 2 },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500', id: 3 },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500', id: 4 },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500', id: 5 },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500', id: 6 },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500', id: 7 }
}

const createEmptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(0))

// ピースの型定義を追加します
interface Piece {
  shape: number[][]
  x: number
  y: number
  color: string
  id: number
}

export function TetrisGameComponent() {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<Piece>({ shape: [], x: 0, y: 0, color: '', id: 0 })
  const [nextPiece, setNextPiece] = useState<Piece>({ shape: [], x: 0, y: 0, color: '', id: 0 })
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isGameStarted, setIsGameStarted] = useState(false)

  const generateRandomPiece = useCallback((): Piece => {
    const pieces = Object.keys(TETROMINOS)
    const randomKey = pieces[Math.floor(Math.random() * pieces.length)]
    const tetromino = TETROMINOS[randomKey]
    return { ...tetromino, x: 3, y: 0 }
  }, [])

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard())
    const firstPiece = generateRandomPiece()
    const secondPiece = generateRandomPiece()
    setCurrentPiece(firstPiece)
    setNextPiece(secondPiece)
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setIsPaused(false)
    setIsGameStarted(true)
  }, [generateRandomPiece])

  const isCollision = useCallback((piece: Piece, board: number[][]) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const newY = y + piece.y
          const newX = x + piece.x
          if (
            board[newY] === undefined ||
            board[newY][newX] === undefined ||
            board[newY][newX] !== 0
          ) {
            return true
          }
        }
      }
    }
    return false
  }, [])

  const placePiece = useCallback((piece: Piece, board: number[][]) => {
    const newBoard = board.map(row => [...row])
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newBoard[y + piece.y][x + piece.x] = piece.id // ピースのIDを使用
        }
      })
    })
    return newBoard
  }, [])

  const checkRows = useCallback((board: number[][]) => {
    return board.reduce((acc, row, y) => {
      if (row.every(cell => cell !== 0)) {
        acc.push(y)
      }
      return acc
    }, [] as number[])
  }, [])

  const removeRows = useCallback((board: number[][], rowsToRemove: number[]) => {
    const newBoard = board.filter((_, index) => !rowsToRemove.includes(index))
    const emptyRows = Array.from({ length: rowsToRemove.length }, () => Array(10).fill(0))
    return [...emptyRows, ...newBoard]
  }, [])

  const updateScore = useCallback((clearedLines: number) => {
    const linePoints = [40, 100, 300, 1200]
    setScore(prevScore => {
      const newScore = prevScore + linePoints[clearedLines - 1] * level
      setLevel(Math.floor(newScore / 1000) + 1)
      return newScore
    })
  }, [level])

  const moveLeft = useCallback(() => {
    if (!isPaused && !gameOver && isGameStarted) {
      setCurrentPiece(prev => {
        const newPiece = { ...prev, x: prev.x - 1 }
        if (isCollision(newPiece, board)) {
          return prev
        }
        return newPiece
      })
    }
  }, [isPaused, gameOver, isGameStarted, board, isCollision])

  const moveRight = useCallback(() => {
    if (!isPaused && !gameOver && isGameStarted) {
      setCurrentPiece(prev => {
        const newPiece = { ...prev, x: prev.x + 1 }
        if (isCollision(newPiece, board)) {
          return prev
        }
        return newPiece
      })
    }
  }, [isPaused, gameOver, isGameStarted, board, isCollision])

  const rotate = useCallback(() => {
    if (!isPaused && !gameOver && isGameStarted) {
      setCurrentPiece(prev => {
        const rotatedShape = prev.shape[0].map((_, index) => prev.shape.map(row => row[index]).reverse())
        const newPiece = { ...prev, shape: rotatedShape }
        if (isCollision(newPiece, board)) {
          return prev
        }
        return newPiece
      })
    }
  }, [isPaused, gameOver, isGameStarted, board, isCollision])

  const drop = useCallback(() => {
    if (!isPaused && !gameOver && isGameStarted) {
      setCurrentPiece(prev => {
        const newPiece = { ...prev, y: prev.y + 1 }
        if (isCollision(newPiece, board)) {
          let newBoard = placePiece(prev, board)
          const clearedRows = checkRows(newBoard)
          if (clearedRows.length > 0) {
            newBoard = removeRows(newBoard, clearedRows)
            updateScore(clearedRows.length)
          }
          setBoard(newBoard)
          setCurrentPiece(nextPiece)
          const newNextPiece = generateRandomPiece()
          setNextPiece(newNextPiece)
          if (isCollision(nextPiece, newBoard)) {
            setGameOver(true)
          }
          return nextPiece
        }
        return newPiece
      })
    }
  }, [isPaused, gameOver, isGameStarted, board, isCollision, placePiece, generateRandomPiece, nextPiece, checkRows, removeRows, updateScore])

  const hardDrop = useCallback(() => {
    if (!isPaused && !gameOver && isGameStarted) {
      let newY = currentPiece.y
      while (!isCollision({ ...currentPiece, y: newY + 1 }, board)) {
        newY++
      }
      setCurrentPiece(prev => ({ ...prev, y: newY }))
      drop()
    }
  }, [isPaused, gameOver, isGameStarted, currentPiece, board, isCollision, drop])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isGameStarted) return
      switch (e.key) {
        case 'ArrowLeft':
          moveLeft()
          break
        case 'ArrowRight':
          moveRight()
          break
        case 'ArrowUp':
          rotate()
          break
        case 'ArrowDown':
          drop()
          break
        case ' ':
          hardDrop()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isGameStarted, moveLeft, moveRight, rotate, drop, hardDrop])

  useEffect(() => {
    if (isGameStarted && !isPaused && !gameOver) {
      const interval = 1000 - (level - 1) * 100
      const gameLoop = setInterval(() => {
        drop()
      }, interval > 100 ? interval : 100) // 最低間隔を100msに設定

      return () => {
        clearInterval(gameLoop)
      }
    }
  }, [isGameStarted, isPaused, gameOver, level, drop])

  const renderBoard = () => {
    const boardWithPiece = board.map(row => [...row])
    if (currentPiece.shape.length > 0) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = y + currentPiece.y
            const boardX = x + currentPiece.x
            if (boardWithPiece[boardY] && boardWithPiece[boardY][boardX] === 0) {
              boardWithPiece[boardY][boardX] = currentPiece.id
            }
          }
        })
      })
    }

    return boardWithPiece.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`w-6 h-6 border border-gray-700 ${
              cell
                ? cell === currentPiece.id
                  ? currentPiece.color
                  : TETROMINOS[getTetrominoKeyById(cell)].color
                : 'bg-gray-900'
            }`}
          />
        ))}
      </div>
    ))
  }

  // IDからテトロミノのキーを取得するヘルパー関数
  const getTetrominoKeyById = (id: number): string => {
    return Object.keys(TETROMINOS).find(key => TETROMINOS[key].id === id) || 'I'
  }

  const renderNextPiece = () => {
    return nextPiece.shape.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`w-4 h-4 ${cell ? nextPiece.color : 'bg-transparent'}`}
          />
        ))}
      </div>
    ))
  }

  const renderControls = () => (
    <div className="grid grid-cols-3 gap-2 mt-4">
      <Button onClick={moveLeft} className="col-start-1" aria-label="左に移動">
        <ArrowLeft className="w-6 h-6" />
      </Button>
      <Button onClick={rotate} className="col-start-2" aria-label="回転">
        <RotateCcw className="w-6 h-6" />
      </Button>
      <Button onClick={moveRight} className="col-start-3" aria-label="右に移動">
        <ArrowRight className="w-6 h-6" />
      </Button>
      <Button onClick={drop} className="col-start-2 col-span-1" aria-label="落下">
        <ArrowDown className="w-6 h-6" />
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">テトリス</h1>
      {!isGameStarted ? (
        <Button onClick={startGame} className="text-xl px-8 py-4">
          ゲームスタート
        </Button>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="bg-gray-900 p-2 rounded">
            {renderBoard()}
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">次のピース</h2>
              <div className="bg-gray-800 p-2 rounded">
                {renderNextPiece()}
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">スコア</h2>
              <p className="text-2xl">{score}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">レベル</h2>
              <p className="text-2xl">{level}</p>
            </div>
            <Button
              onClick={() => setIsPaused(!isPaused)}
              className="w-full"
            >
              {isPaused ? '再開' : '一時停止'}
            </Button>
            {renderControls()}
          </div>
        </div>
      )}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded text-center">
            <h2 className="text-3xl font-bold mb-4">ゲームオーバー</h2>
            <p className="text-xl mb-4">あなたのスコア: {score}</p>
            <Button onClick={startGame}>
              もう一度プレイ
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}