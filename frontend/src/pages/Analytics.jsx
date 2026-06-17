import React, {
  useEffect,
  useState
} from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function Analytics({
  darkMode
}) {

    const [analytics, setAnalytics] =
        useState({
        messagesSent: 0,
        messagesReceived: 0,
        totalContacts: 0,
        activeRules: 0
        });
    const [topContacts, setTopContacts] = useState([]);
    const [breakdown, setBreakdown] = useState({incoming: 0,outgoing: 0});
    const [peakHours, setPeakHours] = useState([]);
    const [dailyActivity, setDailyActivity] = useState([]);

    useEffect(() => {

        const loadAnalytics =
        async () => {

            try {

            const res =
                await fetch(
                `${API_BASE}/analytics`
                );
                const contactsRes =
                    await fetch(
                        `${API_BASE}/analytics/top-contacts`
                    );

                    const contactsData =
                    await contactsRes.json();

                    setTopContacts(
                    contactsData
                    );



            const peakRes =
                await fetch(
                    `${API_BASE}/analytics/peak-hours`
                );

                const peakData =
                await peakRes.json();

                setPeakHours(
                peakData
                );
            const dailyRes =
                await fetch(
                    `${API_BASE}/analytics/daily-activity`
                );

                const dailyData =
                await dailyRes.json();

                setDailyActivity(
                dailyData.reverse()
                );
            const breakdownRes =
                await fetch(
                    `${API_BASE}/analytics/breakdown`
                );

                const breakdownData =
                await breakdownRes.json();

                setBreakdown(
                breakdownData
                );

            const data =
                await res.json();

            setAnalytics(data);

            } catch (err) {

            console.error(err);

            }

        };

        loadAnalytics();

    }, []);


    const totalMessages =
        breakdown.incoming +
        breakdown.outgoing;

        const incomingPercent =
        totalMessages === 0
            ? 0
            : (breakdown.incoming / totalMessages) * 100;

        const outgoingPercent =
        totalMessages === 0
            ? 0
            : (breakdown.outgoing / totalMessages) * 100;

    return (
        <div>

        <h1
            className={`
            text-2xl
            font-bold
            mb-6
            ${
                darkMode
                ? "text-white"
                : "text-slate-800"
            }
            `}
        >
            Analytics
        </h1>

        <div
            className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-4
            "
        >

            <div className="p-5 rounded-xl bg-[#25D366]/10">
            <div className="text-sm opacity-70">
                Messages Sent
            </div>
            <div className="text-3xl font-bold">
                {analytics.messagesSent}
            </div>
            </div>

            <div className="p-5 rounded-xl bg-blue-500/10">
            <div className="text-sm opacity-70">
                Messages Received
            </div>
            <div className="text-3xl font-bold">
                {analytics.messagesReceived}
            </div>
            </div>

            <div className="p-5 rounded-xl bg-orange-500/10">
            <div className="text-sm opacity-70">
                Contacts
            </div>
            <div className="text-3xl font-bold">
                {analytics.totalContacts}
            </div>
            </div>

            <div className="p-5 rounded-xl bg-purple-500/10">
            <div className="text-sm opacity-70">
                Active Rules
            </div>
            <div className="text-3xl font-bold">
                {analytics.activeRules}
            </div>
            </div>

        </div>
        <div
            className={`
                mt-6
                rounded-xl
                p-5
                ${
                darkMode
                    ? "bg-[#202c33]"
                    : "bg-white"
                }
            `}
            >

            <h2 className="text-lg font-semibold mb-4">
                Top Contacts
            </h2>

            <div className="space-y-4">

                {topContacts.map((contact, index) => {

                    const max =
                    topContacts[0]?.totalMessages || 1;

                    const width =
                    (contact.totalMessages / max) * 100;

                    return (

                    <div key={index}>

                        <div
                        className="
                            flex
                            items-center
                            justify-between
                            mb-2
                        "
                        >

                        <div
                            className="
                            flex
                            items-center
                            gap-3
                            "
                        >

                            <div
                            className="
                                w-10
                                h-10
                                rounded-full
                                bg-[#25D366]/20
                                flex
                                items-center
                                justify-center
                                font-bold
                            "
                            >
                            {contact.contactName?.[0] || "?"}
                            </div>

                            <span>
                            {contact.contactName}
                            </span>

                        </div>

                        <span className="font-bold">
                            {contact.totalMessages}
                        </span>

                        </div>

                        <div
                        className={`
                            h-2
                            rounded-full
                            overflow-hidden
                            ${
                            darkMode
                                ? "bg-slate-700"
                                : "bg-slate-200"
                            }
                        `}
                        >

                        <div
                            className="h-full bg-[#25D366]"
                            style={{
                            width: `${width}%`
                            }}
                        />

                        </div>

                    </div>

                    );

                })}

                </div>

            </div>
            <div
                className={`
                    mt-6
                    rounded-xl
                    p-5
                    ${
                    darkMode
                        ? "bg-[#202c33]"
                        : "bg-white"
                    }
                `}
                >

                <h2 className="text-lg font-semibold mb-4">
                    Message Breakdown
                </h2>

                <div className="mb-2 flex justify-between">
                    <span>Incoming</span>
                    <span>{breakdown.incoming}</span>
                </div>

                <div
                    className={`
                    h-3
                    rounded-full
                    overflow-hidden
                    ${
                        darkMode
                        ? "bg-slate-700"
                        : "bg-slate-200"
                    }
                    `}
                >
                    <div
                    className="h-full bg-blue-500"
                    style={{
                        width: `${incomingPercent}%`
                    }}
                    />
                </div>

                <div className="mt-5 mb-2 flex justify-between">
                    <span>Outgoing</span>
                    <span>{breakdown.outgoing}</span>
                </div>

                <div
                    className={`
                    h-3
                    rounded-full
                    overflow-hidden
                    ${
                        darkMode
                        ? "bg-slate-700"
                        : "bg-slate-200"
                    }
                    `}
                >
                    <div
                    className="h-full bg-[#25D366]"
                    style={{
                        width: `${outgoingPercent}%`
                    }}
                    />
                </div>

                </div>
                <div
                    className={`
                        mt-6
                        rounded-xl
                        p-5
                        ${
                        darkMode
                            ? "bg-[#202c33]"
                            : "bg-white"
                        }
                    `}
                    >

                    <h2 className="text-lg font-semibold mb-4">
                        Peak Hours
                    </h2>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                        >
                        <BarChart
                            data={peakHours}
                            margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 5
                            }}
                        >
                            <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.2}
                            />

                            <XAxis
                                dataKey="hour"
                                tickFormatter={(hour) => `${hour}:00`}
                                />

                            <YAxis
                            tick={{ fontSize: 12 }}
                            />

                            <Tooltip />

                            <Bar
                                dataKey="total"
                                fill="#25D366"
                                radius={[10, 10, 0, 0]}
                                barSize={24}
                                />

                        </BarChart>
                        </ResponsiveContainer>

                    </div>
                    <div
                        className={`
                            mt-6
                            rounded-xl
                            p-5
                            ${
                            darkMode
                                ? "bg-[#202c33]"
                                : "bg-white"
                            }
                        `}
                        >

                        <h2 className="text-lg font-semibold mb-4">
                            Daily Activity
                        </h2>

                        <ResponsiveContainer
                            width="100%"
                            height={300}
                            >
                            <LineChart
                                data={dailyActivity}
                                margin={{
                                top: 10,
                                right: 20,
                                left: 0,
                                bottom: 5
                                }}
                            >
                                <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.2}
                                />

                                <XAxis
                                dataKey="day"
                                tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                tick={{ fontSize: 12 }}
                                />

                                <Tooltip />

                                <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#25D366"
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                    fill: "#25D366"
                                }}
                                activeDot={{
                                    r: 7
                                }}
                                />

                            </LineChart>
                            </ResponsiveContainer>

                        </div>
        </div>
        
    );
}