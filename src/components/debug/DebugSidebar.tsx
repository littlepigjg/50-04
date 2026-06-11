import React, { useRef, useEffect } from 'react';
import type { DebugInfo, RobotState, Position } from '../../engine/types';
import { DirectionNames } from '../../engine/types';

interface DebugSidebarProps {
  debugInfo?: DebugInfo;
  robotState: RobotState;
  currentStep: number;
  totalSteps: number;
  collectedStars: Position[];
  totalStars: number;
  isVisible: boolean;
  onClose: () => void;
}

export const DebugSidebar: React.FC<DebugSidebarProps> = ({
  debugInfo,
  robotState,
  currentStep,
  totalSteps,
  collectedStars,
  totalStars,
  isVisible,
  onClose,
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [debugInfo?.executionLog?.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl z-40 flex flex-col animate-slide-in">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span>🔍</span> 调试面板
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span>📍</span> 机器人状态
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">位置:</span>
              <span className="font-mono font-bold text-blue-700">
                ({robotState.position.x}, {robotState.position.y})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">朝向:</span>
              <span className="font-bold text-blue-700">
                {DirectionNames[robotState.direction]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">已收集星星:</span>
              <span className="font-bold text-yellow-600">
                ⭐ {collectedStars.length} / {totalStars}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">执行步数:</span>
              <span className="font-mono font-bold text-green-600">
                {currentStep} / {totalSteps}
              </span>
            </div>
          </div>
        </div>

        {debugInfo?.loopStates && debugInfo.loopStates.length > 0 && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <span>🔄</span> 循环计数器
            </h4>
            <div className="space-y-3">
              {debugInfo.loopStates.map((loop, index) => (
                <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">循环 #{index + 1}</span>
                    <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {loop.blockId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(loop.currentIteration / loop.totalIterations) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-purple-700 font-mono min-w-[50px] text-right">
                      {loop.currentIteration}/{loop.totalIterations}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugInfo?.conditionResults && debugInfo.conditionResults.length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <span>✅</span> 条件判断结果
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {debugInfo.conditionResults.slice(-5).map((cond, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-2 text-sm flex items-center gap-2 ${
                    cond.result
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="text-lg">{cond.result ? '✓' : '✗'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cond.description}</div>
                    <div className="text-xs opacity-70">
                      {cond.type === 'ifWall' && '如果前方是墙'}
                      {cond.type === 'ifStar' && '如果前方有星星'}
                      {cond.type === 'ifEmpty' && '如果前方是空'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugInfo?.callStack && debugInfo.callStack.length > 0 && (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
              <span>📚</span> 调用栈
            </h4>
            <div className="flex flex-wrap gap-1">
              {debugInfo.callStack.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">›</span>}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      index === debugInfo.callStack.length - 1
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-200 text-orange-700'
                    }`}
                  >
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📜</span> 执行日志
          </h4>
          <div
            ref={logRef}
            className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400 max-h-60 overflow-y-auto"
          >
            {debugInfo?.executionLog?.map((log, index) => (
              <div
                key={index}
                className={`py-0.5 ${
                  log.startsWith('错误')
                    ? 'text-red-400'
                    : log.startsWith('失败')
                    ? 'text-red-400'
                    : log.includes('成功')
                    ? 'text-yellow-400'
                    : log.startsWith('条件判断')
                    ? 'text-blue-400'
                    : log.startsWith('循环')
                    ? 'text-purple-400'
                    : ''
                }`}
              >
                <span className="text-gray-500 mr-2">[{index + 1}]</span>
                {log}
              </div>
            ))}
            {(!debugInfo?.executionLog || debugInfo.executionLog.length === 0) && (
              <div className="text-gray-500 italic">暂无日志</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          💡 调试模式已开启，可查看程序执行细节
        </div>
      </div>
    </div>
  );
};

export default DebugSidebar;
