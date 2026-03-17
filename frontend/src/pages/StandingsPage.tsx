import React, { useEffect, useState } from 'react';
import {
    Tabs,
    Tab,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    Box,
    Typography,
    Skeleton,
} from '@mui/material';
import { useYear } from '../contexts/YearContext';
import { getDriverStandings, getConstructorStandings } from '../services/api';
import { DriverStanding, ConstructorStanding } from '../types/f1';

const StandingsPage: React.FC = () => {
    const { year } = useYear();
    const [tab, setTab] = useState(0);
    const [drivers, setDrivers] = useState<DriverStanding[]>([]);
    const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);
    const [loadingConstructors, setLoadingConstructors] = useState(true);

    useEffect(() => {
        setLoadingDrivers(true);
        setLoadingConstructors(true);

        getDriverStandings(year)
            .then((res) => setDrivers(res.standings))
            .catch(() => setDrivers([]))
            .finally(() => setLoadingDrivers(false));

        getConstructorStandings(year)
            .then((res) => setConstructors(res.standings))
            .catch(() => setConstructors([]))
            .finally(() => setLoadingConstructors(false));
    }, [year]);

    const loading = tab === 0 ? loadingDrivers : loadingConstructors;

    const driverMaxPoints = drivers.length > 0 ? Math.max(...drivers.map((d) => d.points)) : 1;
    const constructorMaxPoints =
        constructors.length > 0 ? Math.max(...constructors.map((c) => c.points)) : 1;

    const headerSx = { color: 'text.secondary', fontWeight: 600, borderColor: 'divider' };
    const cellSx = { borderColor: 'divider' };

    const renderSkeletonRows = (cols: number) =>
        Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
                {Array.from({ length: cols }).map((__, j) => (
                    <TableCell key={j} sx={cellSx}>
                        <Skeleton variant="text" width={j === cols - 1 ? '60%' : '80%'} />
                    </TableCell>
                ))}
            </TableRow>
        ));

    const colorDot = (color: string) => (
        <Box
            component="span"
            sx={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: color.startsWith('#') ? color : `#${color}`,
                mr: 1,
                verticalAlign: 'middle',
            }}
        />
    );

    const pointsBar = (points: number, maxPoints: number, teamColor: string) => {
        const normalizedColor = teamColor.startsWith('#') ? teamColor : `#${teamColor}`;
        const widthPct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
        return (
            <Box
                sx={{
                    height: 8,
                    width: `${widthPct}%`,
                    minWidth: points > 0 ? 4 : 0,
                    bgcolor: normalizedColor,
                    opacity: 0.3,
                    borderRadius: 1,
                }}
            />
        );
    };

    return (
        <Box>
            <Typography variant="h3" sx={{ mb: 3 }}>
                {year} Standings
            </Typography>

            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
            >
                <Tab label="Drivers" />
                <Tab label="Constructors" />
            </Tabs>

            <Paper sx={{ overflow: 'hidden' }}>
                {tab === 0 && (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...headerSx, width: 50 }}>#</TableCell>
                                <TableCell sx={headerSx}>Driver</TableCell>
                                <TableCell sx={headerSx}>Team</TableCell>
                                <TableCell sx={{ ...headerSx, width: 80 }} align="right">
                                    Points
                                </TableCell>
                                <TableCell sx={{ ...headerSx, width: '30%' }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? renderSkeletonRows(5)
                                : drivers.map((d) => (
                                      <TableRow
                                          key={d.position}
                                          sx={{
                                              '&:hover': { bgcolor: '#1a1b25' },
                                          }}
                                      >
                                          <TableCell sx={cellSx}>
                                              <Typography variant="body2">
                                                  {d.position}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={cellSx}>
                                              <Typography variant="body1">
                                                  {d.driver}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={cellSx}>
                                              <Box
                                                  sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                  }}
                                              >
                                                  {colorDot(d.team_color)}
                                                  <Typography variant="body2" color="text.secondary">
                                                      {d.team}
                                                  </Typography>
                                              </Box>
                                          </TableCell>
                                          <TableCell sx={cellSx} align="right">
                                              <Typography variant="body2" fontWeight={600}>
                                                  {d.points}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={cellSx}>
                                              {pointsBar(d.points, driverMaxPoints, d.team_color)}
                                          </TableCell>
                                      </TableRow>
                                  ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 1 && (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...headerSx, width: 50 }}>#</TableCell>
                                <TableCell sx={headerSx}>Team</TableCell>
                                <TableCell sx={{ ...headerSx, width: 80 }} align="right">
                                    Points
                                </TableCell>
                                <TableCell sx={{ ...headerSx, width: '35%' }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? renderSkeletonRows(4)
                                : constructors.map((c) => (
                                      <TableRow
                                          key={c.position}
                                          sx={{
                                              '&:hover': { bgcolor: '#1a1b25' },
                                          }}
                                      >
                                          <TableCell sx={cellSx}>
                                              <Typography variant="body2">
                                                  {c.position}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={cellSx}>
                                              <Box
                                                  sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                  }}
                                              >
                                                  {colorDot(c.team_color)}
                                                  <Typography variant="body1">
                                                      {c.team}
                                                  </Typography>
                                              </Box>
                                          </TableCell>
                                          <TableCell sx={cellSx} align="right">
                                              <Typography variant="body2" fontWeight={600}>
                                                  {c.points}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={cellSx}>
                                              {pointsBar(
                                                  c.points,
                                                  constructorMaxPoints,
                                                  c.team_color
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>
        </Box>
    );
};

export default StandingsPage;
