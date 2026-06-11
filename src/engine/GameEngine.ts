import type {
  BlockType,
  CellType,
  DebugInfo,
  Direction,
  ExecutionState,
  Level,
  Position,
  Program,
  ProgramBlock,
  RobotState,
} from './types';
import { DirectionVectors } from './types';

export function createEmptyGrid(width: number, height: number): CellType[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'empty' as CellType)
  );
}

export function isValidPosition(
  level: Level,
  pos: Position
): boolean {
  return (
    pos.x >= 0 &&
    pos.x < level.width &&
    pos.y >= 0 &&
    pos.y < level.height
  );
}

export function isWalkable(
  level: Level,
  pos: Position
): boolean {
  if (!isValidPosition(level, pos)) return false;
  const cell = level.grid[pos.y][pos.x];
  return cell !== 'wall';
}

export function getCellAt(level: Level, pos: Position): CellType | null {
  if (!isValidPosition(level, pos)) return null;
  return level.grid[pos.y][pos.x];
}

export function getForwardPosition(
  robot: RobotState
): Position {
  const vec = DirectionVectors[robot.direction];
  return {
    x: robot.position.x + vec.dx,
    y: robot.position.y + vec.dy,
  };
}

export function turnLeft(direction: Direction): Direction {
  return ((direction + 3) % 4) as Direction;
}

export function turnRight(direction: Direction): Direction {
  return ((direction + 1) % 4) as Direction;
}

export function positionEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function cloneRobotState(robot: RobotState): RobotState {
  return {
    position: { ...robot.position },
    direction: robot.direction,
    stars: robot.stars.map((s) => ({ ...s })),
  };
}

export function createInitialRobotState(level: Level): RobotState {
  return {
    position: { ...level.start },
    direction: level.startDirection,
    stars: level.stars.map((s) => ({ ...s })),
  };
}

export function createInitialExecutionState(
  level: Level
): ExecutionState {
  const robot = createInitialRobotState(level);
  return {
    status: 'idle',
    robot,
    collectedStars: [],
    currentStep: 0,
    totalSteps: 0,
    debugInfo: {
      pathHistory: [
        {
          position: { ...robot.position },
          direction: robot.direction,
          step: 0,
        },
      ],
      loopStates: [],
      conditionResults: [],
      executionLog: ['程序初始化完成'],
      callStack: ['main'],
    },
  };
}

function flattenBlocks(
  blocks: ProgramBlock[],
  functions: Record<string, ProgramBlock[]>,
  depth: number = 0,
  maxDepth: number = 100
): { block: ProgramBlock; id: string }[] {
  if (depth > maxDepth) {
    throw new Error('嵌套层数过深，可能存在无限循环');
  }

  const result: { block: ProgramBlock; id: string }[] = [];

  for (const block of blocks) {
    result.push({ block, id: block.id });

    if (block.type === 'loop') {
      const count = block.repeatCount || 2;
      for (let i = 0; i < count; i++) {
        if (block.children) {
          result.push(
            ...flattenBlocks(block.children, functions, depth + 1, maxDepth)
          );
        }
      }
    } else if (
      block.type === 'ifWall' ||
      block.type === 'ifStar' ||
      block.type === 'ifEmpty'
    ) {
      if (block.children) {
        result.push(
          ...flattenBlocks(block.children, functions, depth + 1, maxDepth)
        );
      }
    } else if (block.type === 'callFunction') {
      const funcBlocks = functions[block.functionId || 'func1'];
      if (funcBlocks && funcBlocks.length > 0) {
        result.push(
          ...flattenBlocks(funcBlocks, functions, depth + 1, maxDepth)
        );
      }
    }
  }

  return result;
}

export function estimateTotalSteps(program: Program): number {
  try {
    const flattened = flattenBlocks(program.main, program.functions);
    return flattened.length;
  } catch {
    return 0;
  }
}

export interface ExecutionStep {
  state: ExecutionState;
  blockId?: string;
}

function cloneDebugInfo(debugInfo?: DebugInfo): DebugInfo | undefined {
  if (!debugInfo) return undefined;
  return {
    pathHistory: debugInfo.pathHistory.map((p) => ({
      position: { ...p.position },
      direction: p.direction,
      step: p.step,
    })),
    loopStates: debugInfo.loopStates.map((l) => ({ ...l })),
    conditionResults: debugInfo.conditionResults.map((c) => ({ ...c })),
    executionLog: [...debugInfo.executionLog],
    callStack: [...debugInfo.callStack],
  };
}

function getBlockLabel(block: ProgramBlock): string {
  const labels: Record<BlockType, string> = {
    move: '前进',
    turnLeft: '左转',
    turnRight: '右转',
    loop: '循环',
    ifWall: '如果前方是墙',
    ifStar: '如果前方有星星',
    ifEmpty: '如果前方是空',
    function: '定义函数',
    callFunction: '调用函数',
  };
  return labels[block.type] || block.type;
}

export function generateExecutionPlan(
  level: Level,
  program: Program
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let state = createInitialExecutionState(level);
  state.totalSteps = estimateTotalSteps(program);

  steps.push({
    state: {
      ...state,
      robot: cloneRobotState(state.robot),
      debugInfo: cloneDebugInfo(state.debugInfo),
    },
  });

  function evaluateCondition(
    block: ProgramBlock,
    robot: RobotState
  ): boolean {
    const forward = getForwardPosition(robot);
    let result = false;
    let description = '';

    switch (block.type) {
      case 'ifWall':
        result = !isWalkable(level, forward);
        description = result ? '前方有墙' : '前方没有墙';
        break;
      case 'ifStar': {
        const hasUncollected = state.robot.stars.some((s) =>
          positionEquals(s, forward)
        );
        result = hasUncollected;
        description = result ? '前方有星星' : '前方没有星星';
        break;
      }
      case 'ifEmpty':
        result = isWalkable(level, forward);
        description = result ? '前方可以通行' : '前方不可通行';
        break;
      default:
        result = false;
        description = '未知条件';
    }

    if (state.debugInfo) {
      state.debugInfo.conditionResults.push({
        blockId: block.id,
        type: block.type,
        result,
        description,
      });
      state.debugInfo.executionLog.push(
        `条件判断 [${getBlockLabel(block)}]: ${description} → ${result ? '执行' : '跳过'}`
      );
    }

    return result;
  }

  function executeBlock(
    block: ProgramBlock,
    functions: Record<string, ProgramBlock[]>,
    depth: number = 0
  ): boolean {
    if (depth > 100) {
      state.status = 'failed';
      state.error = '嵌套层数过深，可能存在无限循环';
      return false;
    }

    state.highlightedBlockId = block.id;

    if (state.debugInfo) {
      state.debugInfo.executionLog.push(`执行指令: ${getBlockLabel(block)}`);
    }

    steps.push({
      state: {
        ...state,
        robot: cloneRobotState(state.robot),
        debugInfo: cloneDebugInfo(state.debugInfo),
      },
      blockId: block.id,
    });

    switch (block.type) {
      case 'move': {
        const nextPos = getForwardPosition(state.robot);
        if (!isWalkable(level, nextPos)) {
          state.status = 'failed';
          state.error = '机器人撞到了障碍物！';
          if (state.debugInfo) {
            state.debugInfo.executionLog.push('错误: 机器人撞到了障碍物！');
          }
          return false;
        }
        state.robot.position = nextPos;
        state.currentStep++;

        if (state.debugInfo) {
          state.debugInfo.pathHistory.push({
            position: { ...nextPos },
            direction: state.robot.direction,
            step: state.currentStep,
          });
          state.debugInfo.executionLog.push(
            `移动到位置 (${nextPos.x}, ${nextPos.y})`
          );
        }

        const starIndex = state.robot.stars.findIndex((s) =>
          positionEquals(s, nextPos)
        );
        if (starIndex !== -1) {
          const [collected] = state.robot.stars.splice(starIndex, 1);
          state.collectedStars.push(collected);
          if (state.debugInfo) {
            state.debugInfo.executionLog.push('收集到一颗星星！⭐');
          }
        }

        const cell = getCellAt(level, nextPos);
        if (cell === 'pit') {
          state.status = 'failed';
          state.error = '机器人掉进了陷阱！';
          if (state.debugInfo) {
            state.debugInfo.executionLog.push('错误: 机器人掉进了陷阱！');
          }
          steps.push({
            state: {
              ...state,
              robot: cloneRobotState(state.robot),
              debugInfo: cloneDebugInfo(state.debugInfo),
            },
          });
          return false;
        }
        break;
      }

      case 'turnLeft':
        state.robot.direction = turnLeft(state.robot.direction);
        state.currentStep++;
        if (state.debugInfo) {
          const dirNames: Record<Direction, string> = {
            0: '上',
            1: '右',
            2: '下',
            3: '左',
          };
          state.debugInfo.executionLog.push(
            `左转，现在朝向 ${dirNames[state.robot.direction]}`
          );
          state.debugInfo.pathHistory.push({
            position: { ...state.robot.position },
            direction: state.robot.direction,
            step: state.currentStep,
          });
        }
        break;

      case 'turnRight':
        state.robot.direction = turnRight(state.robot.direction);
        state.currentStep++;
        if (state.debugInfo) {
          const dirNames: Record<Direction, string> = {
            0: '上',
            1: '右',
            2: '下',
            3: '左',
          };
          state.debugInfo.executionLog.push(
            `右转，现在朝向 ${dirNames[state.robot.direction]}`
          );
          state.debugInfo.pathHistory.push({
            position: { ...state.robot.position },
            direction: state.robot.direction,
            step: state.currentStep,
          });
        }
        break;

      case 'loop': {
        const count = block.repeatCount || 2;

        if (state.debugInfo) {
          state.debugInfo.loopStates.push({
            blockId: block.id,
            currentIteration: 0,
            totalIterations: count,
          });
          state.debugInfo.callStack.push(`loop-${block.id.slice(0, 6)}`);
        }

        for (let i = 0; i < count; i++) {
          if (state.debugInfo) {
            const loopState = state.debugInfo.loopStates.find(
              (l) => l.blockId === block.id
            );
            if (loopState) {
              loopState.currentIteration = i + 1;
            }
            state.debugInfo.executionLog.push(
              `循环第 ${i + 1}/${count} 次`
            );
          }

          if (block.children) {
            for (const child of block.children) {
              if (!executeBlock(child, functions, depth + 1)) {
                if (state.debugInfo) {
                  state.debugInfo.loopStates =
                    state.debugInfo.loopStates.filter(
                      (l) => l.blockId !== block.id
                    );
                  state.debugInfo.callStack.pop();
                }
                return false;
              }
            }
          }
        }

        if (state.debugInfo) {
          state.debugInfo.loopStates = state.debugInfo.loopStates.filter(
            (l) => l.blockId !== block.id
          );
          state.debugInfo.callStack.pop();
        }
        break;
      }

      case 'ifWall':
      case 'ifStar':
      case 'ifEmpty': {
        const conditionMet = evaluateCondition(block, state.robot);
        if (conditionMet) {
          if (state.debugInfo) {
            state.debugInfo.callStack.push(`if-${block.id.slice(0, 6)}`);
          }
          if (block.children) {
            for (const child of block.children) {
              if (!executeBlock(child, functions, depth + 1)) {
                if (state.debugInfo) {
                  state.debugInfo.callStack.pop();
                }
                return false;
              }
            }
          }
          if (state.debugInfo) {
            state.debugInfo.callStack.pop();
          }
        }
        break;
      }

      case 'callFunction': {
        const funcId = block.functionId || 'func1';
        const funcBlocks = functions[funcId];

        if (state.debugInfo) {
          state.debugInfo.callStack.push(`func-${funcId}`);
          state.debugInfo.executionLog.push(`调用函数: ${funcId}`);
        }

        if (funcBlocks) {
          for (const child of funcBlocks) {
            if (!executeBlock(child, functions, depth + 1)) {
              if (state.debugInfo) {
                state.debugInfo.callStack.pop();
              }
              return false;
            }
          }
        }

        if (state.debugInfo) {
          state.debugInfo.callStack.pop();
        }
        break;
      }

      default:
        break;
    }

    steps.push({
      state: {
        ...state,
        robot: cloneRobotState(state.robot),
        debugInfo: cloneDebugInfo(state.debugInfo),
      },
    });
    return true;
  }

  const functions: Record<string, ProgramBlock[]> = {};
  for (const block of program.main) {
    if (block.type === 'function') {
      functions[block.functionId || 'func1'] = block.children || [];
    }
  }

  const mainBlocks = program.main.filter((b) => b.type !== 'function');

  if (state.debugInfo) {
    state.debugInfo.executionLog.push('开始执行程序');
  }

  for (const block of mainBlocks) {
    if (!executeBlock(block, functions, 0)) break;
  }

  if (state.status !== 'failed') {
    if (positionEquals(state.robot.position, level.goal)) {
      if (state.robot.stars.length === 0) {
        state.status = 'success';
        if (state.debugInfo) {
          state.debugInfo.executionLog.push('🎉 程序执行成功！');
        }
      } else {
        state.status = 'failed';
        state.error = `还有 ${state.robot.stars.length} 颗星星没有收集！`;
        if (state.debugInfo) {
          state.debugInfo.executionLog.push(
            `失败: 还有 ${state.robot.stars.length} 颗星星没有收集！`
          );
        }
      }
    } else {
      state.status = 'failed';
      state.error = '机器人没有到达终点！';
      if (state.debugInfo) {
        state.debugInfo.executionLog.push('失败: 机器人没有到达终点！');
      }
    }
  }

  steps.push({
    state: {
      ...state,
      robot: cloneRobotState(state.robot),
      highlightedBlockId: undefined,
      debugInfo: cloneDebugInfo(state.debugInfo),
    },
  });

  return steps;
}

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];

  if (level.width < 3 || level.width > 20) {
    errors.push('地图宽度应在 3-20 之间');
  }
  if (level.height < 3 || level.height > 20) {
    errors.push('地图高度应在 3-20 之间');
  }

  if (!isValidPosition(level, level.start)) {
    errors.push('起点位置无效');
  }
  if (!isValidPosition(level, level.goal)) {
    errors.push('终点位置无效');
  }

  if (positionEquals(level.start, level.goal)) {
    errors.push('起点和终点不能在同一位置');
  }

  for (const star of level.stars) {
    if (!isValidPosition(level, star)) {
      errors.push('星星位置无效');
    }
    if (positionEquals(star, level.start) || positionEquals(star, level.goal)) {
      errors.push('星星不能放在起点或终点');
    }
  }

  const cell = getCellAt(level, level.start);
  if (cell === 'wall') {
    errors.push('起点不能是墙壁');
  }
  const goalCell = getCellAt(level, level.goal);
  if (goalCell === 'wall') {
    errors.push('终点不能是墙壁');
  }

  if (level.allowedBlocks.length === 0) {
    errors.push('至少允许使用一种指令块');
  }

  return errors;
}
