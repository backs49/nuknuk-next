"use client";

import { formatOrderPrice } from "@/data/order";

interface BreakdownData {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

interface SalesBreakdownTableProps {
  productData: BreakdownData[];
  channelData: BreakdownData[];
}

function PercentageBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div
          className="h-1.5 rounded-full bg-sage-400"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-9 text-right shrink-0">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

export default function SalesBreakdownTable({ productData, channelData }: SalesBreakdownTableProps) {
  const sortedProducts = [...productData].sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-6">
      {/* 상품별 매출 랭킹 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-semibold text-charcoal-400 mb-4">상품별 매출 랭킹</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-400 w-10">순위</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-400">상품명</th>
                <th className="text-right py-2 pr-4 font-medium text-gray-400 whitespace-nowrap">판매 수량</th>
                <th className="text-right py-2 pr-4 font-medium text-gray-400 whitespace-nowrap">매출액</th>
                <th className="text-left py-2 font-medium text-gray-400 min-w-[120px]">비중</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((item, index) => (
                <tr key={item.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    {index === 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sage-400 text-white text-xs font-bold">
                        1
                      </span>
                    ) : index === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warm-200 text-charcoal-400 text-xs font-bold">
                        2
                      </span>
                    ) : index === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blush-400 text-white text-xs font-bold">
                        3
                      </span>
                    ) : (
                      <span className="text-gray-400 pl-1">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-medium text-charcoal-400">{item.name}</td>
                  <td className="py-3 pr-4 text-right text-charcoal-300">{item.count}개</td>
                  <td className="py-3 pr-4 text-right font-semibold text-charcoal-400 whitespace-nowrap">
                    {formatOrderPrice(item.total)}
                  </td>
                  <td className="py-3">
                    <PercentageBar percentage={item.percentage} />
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 결제 채널 비교 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-semibold text-charcoal-400 mb-4">결제 채널 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-400">채널</th>
                <th className="text-right py-2 pr-4 font-medium text-gray-400">건수</th>
                <th className="text-right py-2 pr-4 font-medium text-gray-400 whitespace-nowrap">매출액</th>
                <th className="text-left py-2 font-medium text-gray-400 min-w-[120px]">비중</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((channel) => (
                <tr key={channel.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            channel.name === "직접 결제" ? "#6B8E23" : "#E8998D",
                        }}
                      />
                      <span className="font-medium text-charcoal-400">{channel.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right text-charcoal-300">{channel.count}건</td>
                  <td className="py-3 pr-4 text-right font-semibold text-charcoal-400 whitespace-nowrap">
                    {formatOrderPrice(channel.total)}
                  </td>
                  <td className="py-3">
                    <PercentageBar percentage={channel.percentage} />
                  </td>
                </tr>
              ))}
              {channelData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
