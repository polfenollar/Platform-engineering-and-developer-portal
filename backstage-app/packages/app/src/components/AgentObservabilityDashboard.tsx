import { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  LinearProgress,
  Chip,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import WarningIcon from '@material-ui/icons/Warning';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import RestoreIcon from '@material-ui/icons/Restore';
import SpeedIcon from '@material-ui/icons/Speed';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(3),
    backgroundColor: '#0a0c10',
    color: '#e6edf3',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  titleSection: {
    marginBottom: theme.spacing(4),
  },
  mainTitle: {
    fontWeight: 800,
    fontSize: '2.25rem',
    background: 'linear-gradient(90deg, #58a6ff 0%, #bc8cff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    color: '#8b949e',
    marginTop: theme.spacing(1),
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    color: '#e6edf3',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 30px rgba(88, 166, 255, 0.15)',
      borderColor: '#58a6ff',
    },
  },
  metricValue: {
    fontWeight: 700,
    fontSize: '2.5rem',
    margin: theme.spacing(1, 0),
    color: '#ffffff',
  },
  chipActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    color: '#58a6ff',
    border: '1px solid rgba(56, 139, 253, 0.4)',
    fontWeight: 600,
  },
  chipIdle: {
    backgroundColor: 'rgba(139, 148, 158, 0.15)',
    color: '#8b949e',
    border: '1px solid rgba(139, 148, 158, 0.4)',
  },
  chipError: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    color: '#ff7b72',
    border: '1px solid rgba(248, 81, 73, 0.4)',
    fontWeight: 600,
  },
  chipSuccess: {
    backgroundColor: 'rgba(46, 160, 67, 0.15)',
    color: '#3fb950',
    border: '1px solid rgba(46, 160, 67, 0.4)',
  },
  tableContainer: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  tableHeaderCell: {
    backgroundColor: '#0d1117',
    color: '#8b949e',
    fontWeight: 600,
    borderBottom: '1px solid #30363d',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  },
  tableCell: {
    color: '#e6edf3',
    borderBottom: '1px solid #21262d',
    padding: theme.spacing(2),
  },
  progress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#21262d',
  },
  progressSuccess: {
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #3fb950 0%, #2ea043 100%)',
    },
  },
  progressError: {
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #ff7b72 0%, #f85149 100%)',
    },
  },
  consoleBox: {
    fontFamily: 'Fira Code, Source Code Pro, monospace',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '8px',
    padding: theme.spacing(2),
    color: '#7ee787',
    maxHeight: '240px',
    overflowY: 'auto',
    fontSize: '0.85rem',
  },
  actionBtn: {
    background: 'linear-gradient(90deg, #238636 0%, #2ea043 100%)',
    color: '#ffffff',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    '&:hover': {
      background: 'linear-gradient(90deg, #2ea043 0%, #3fb950 100%)',
    },
  },
  alertBtn: {
    background: 'linear-gradient(90deg, #da3633 0%, #f85149 100%)',
    color: '#ffffff',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    '&:hover': {
      background: 'linear-gradient(90deg, #f85149 0%, #ff7b72 100%)',
    },
  },
}));

interface Agent {
  name: string;
  status: 'Idle' | 'Active' | 'Error';
  lastRun: string;
  runsCount: number;
  successRate: number;
  flagName: string;
  rollbackState: 'Healthy' | 'Reverted';
}

interface RollbackEvent {
  time: string;
  alert: string;
  service: string;
  flag: string;
  action: string;
  status: 'Completed' | 'Pending';
}

export function AgentObservabilityDashboard() {
  const classes = useStyles();
  const [logs, setLogs] = useState<string[]>([
    '[2026-06-10 15:30:12] Rollback Controller initialized successfully.',
    '[2026-06-10 15:30:15] Webhook endpoint listening on port 5000.',
    '[2026-06-10 15:30:20] Watching Git repository: polfenollar/developer-portal.git',
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      name: 'literature-synthesis-agent',
      status: 'Idle',
      lastRun: '15 mins ago',
      runsCount: 142,
      successRate: 99.3,
      flagName: 'pubmed-synthesis-v2',
      rollbackState: 'Healthy',
    },
    {
      name: 'veyor-quoting-agent',
      status: 'Active',
      lastRun: 'Just now',
      runsCount: 524,
      successRate: 98.1,
      flagName: 'intelligent-route-optimization',
      rollbackState: 'Healthy',
    },
    {
      name: 'biomedical-ingestion-agent',
      status: 'Idle',
      lastRun: '2 hours ago',
      runsCount: 45,
      successRate: 100.0,
      flagName: 'pubmed-bulk-ingestion',
      rollbackState: 'Healthy',
    },
  ]);

  const [rollbackHistory, setRollbackHistory] = useState<RollbackEvent[]>([
    {
      time: '2026-06-09 18:24:10',
      alert: 'FeatureFlagRollbackAlert',
      service: 'biomedical-api',
      flag: 'pubmed-synthesis-v2',
      action: 'Reverted `enabled` to `false` in Git',
      status: 'Completed',
    },
    {
      time: '2026-06-08 11:45:02',
      alert: 'FeatureFlagRollbackAlert',
      service: 'veyor-backend',
      flag: 'intelligent-route-optimization',
      action: 'Reverted `enabled` to `false` in Git',
      status: 'Completed',
    },
  ]);

  const [simulating, setSimulating] = useState(false);

  const simulateHighErrorSpike = async () => {
    setSimulating(true);
    setLogs(prev => [
      ...prev,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [SIMULATION] Injecting error spike into veyor-quoting-agent (flag: intelligent-route-optimization)...`,
    ]);

    // Update agent status to error
    setAgents(prev =>
      prev.map(a =>
        a.name === 'veyor-quoting-agent'
          ? { ...a, status: 'Error', successRate: 88.5 }
          : a,
      ),
    );

    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Prometheus Alert 'FeatureFlagRollbackAlert' triggered! Severity: critical`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Alertmanager forwarding webhook to http://rollback-controller.observability.svc.cluster.local:5000/webhook`,
      ]);
    }, 1500);

    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Rollback Controller received webhook! Parsed flag_name: 'intelligent-route-optimization'`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Rollback Controller checking current state in Git repository...`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Flag 'intelligent-route-optimization' is currently ENABLED. Reverting to DISABLED...`,
      ]);
    }, 3000);

    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Modifying platform/feature-flags/features.json in git clone...`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Git Commit: 'chore(gitops): auto-rollback flag intelligent-route-optimization due to high error rate [ci skip]'`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Pushed to github.com/polfenollar/developer-portal.git (main branch) successfully!`,
        `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] GitOps Agent notified. Reconciliation completed.`,
      ]);

      setAgents(prev =>
        prev.map(a =>
          a.name === 'veyor-quoting-agent'
            ? { ...a, status: 'Idle', successRate: 98.1, rollbackState: 'Reverted' }
            : a,
        ),
      );

      setRollbackHistory(prev => [
        {
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          alert: 'FeatureFlagRollbackAlert',
          service: 'veyor-quoting-agent',
          flag: 'intelligent-route-optimization',
          action: 'Reverted `enabled` to `false` in Git',
          status: 'Completed',
        },
        ...prev,
      ]);
      setSimulating(false);
    }, 5000);
  };

  const resetSimulation = () => {
    setAgents(prev =>
      prev.map(a => ({
        ...a,
        status: a.name === 'veyor-quoting-agent' ? 'Active' : 'Idle',
        rollbackState: 'Healthy',
        successRate: a.name === 'veyor-quoting-agent' ? 98.1 : a.successRate,
      })),
    );
    setLogs([
      '[2026-06-10 15:30:12] Rollback Controller initialized successfully.',
      '[2026-06-10 15:30:15] Webhook endpoint listening on port 5000.',
      '[2026-06-10 15:30:20] Watching Git repository: polfenollar/developer-portal.git',
      '[2026-06-10 15:35:00] Simulation environment state reset to default.',
    ]);
  };

  return (
    <div className={classes.container}>
      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12} className={classes.titleSection}>
          <Typography className={classes.mainTitle} variant="h1">
            Agentic Operations & Rollback Control
          </Typography>
          <Typography className={classes.subtitle} variant="body1">
            GitOps-native feature flag monitoring, agent status tracking, and event-driven automated rollbacks.
          </Typography>
        </Grid>

        {/* Metric Cards */}
        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">ACTIVE AGENTS</Typography>
                <CloudQueueIcon style={{ color: '#58a6ff' }} />
              </Box>
              <Typography className={classes.metricValue}>3</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={100} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">SYSTEM HEALTH</Typography>
                <CheckCircleIcon style={{ color: '#3fb950' }} />
              </Box>
              <Typography className={classes.metricValue}>99.1%</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={99.1} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">AUTO-ROLLBACK TARGETS</Typography>
                <RestoreIcon style={{ color: '#bc8cff' }} />
              </Box>
              <Typography className={classes.metricValue}>4 Flags</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={75} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">WEBHOOK LATENCY</Typography>
                <SpeedIcon style={{ color: '#58a6ff' }} />
              </Box>
              <Typography className={classes.metricValue}>42ms</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={95} />
            </CardContent>
          </Card>
        </Grid>

        {/* Active Agents Table */}
        <Grid item xs={12}>
          <Typography variant="h6" style={{ marginBottom: '16px', fontWeight: 600 }}>
            Autonomous Agents & Monitored Feature Flags
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeaderCell}>Agent Name</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Status</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Monitored Feature Flag</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Total Runs</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Success Rate</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Rollback State</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Last Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.name}>
                    <TableCell className={classes.tableCell} style={{ fontWeight: 600, color: '#ffffff' }}>
                      {agent.name}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <Chip
                        label={agent.status}
                        className={
                          agent.status === 'Active'
                            ? classes.chipActive
                            : agent.status === 'Error'
                            ? classes.chipError
                            : classes.chipIdle
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={classes.tableCell} style={{ fontFamily: 'monospace', color: '#58a6ff' }}>
                      {agent.flagName}
                    </TableCell>
                    <TableCell className={classes.tableCell}>{agent.runsCount}</TableCell>
                    <TableCell className={classes.tableCell}>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" style={{ marginRight: '8px', fontWeight: 600 }}>
                          {agent.successRate}%
                        </Typography>
                        <Box width="100px">
                          <LinearProgress
                            className={`${classes.progress} ${
                              agent.successRate > 95 ? classes.progressSuccess : classes.progressError
                            }`}
                            variant="determinate"
                            value={agent.successRate}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <Chip
                        label={agent.rollbackState}
                        className={
                          agent.rollbackState === 'Healthy' ? classes.chipSuccess : classes.chipError
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={classes.tableCell} style={{ color: '#8b949e' }}>
                      {agent.lastRun}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Simulation and Controller Logs */}
        <Grid item xs={12} md={6}>
          <Card className={classes.card} style={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '16px' }}>
                Rollback Controller Logs & Event Stream
              </Typography>
              <Box className={classes.consoleBox}>
                {logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '6px' }}>
                    {log}
                  </div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* GitOps Rollback Simulation Controls */}
        <Grid item xs={12} md={6}>
          <Card className={classes.card} style={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '12px' }}>
                Automated Rollback Simulation Panel
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: '20px' }}>
                Simulate a production-grade automated rollback. If Prometheus detects an error rate above 5% on an active agent, it triggers Alertmanager which sends a webhook to the custom Rollback Controller. The controller automatically commits a state reversion directly to the GitOps repository.
              </Typography>
              <Box display="flex" style={{ gap: '16px' }}>
                <Button
                  variant="contained"
                  className={classes.alertBtn}
                  onClick={simulateHighErrorSpike}
                  disabled={simulating || agents[1].rollbackState === 'Reverted'}
                  startIcon={simulating ? <AutorenewIcon className="spin" /> : <WarningIcon />}
                >
                  {simulating ? 'Processing Reversion...' : 'Simulate Agent Error Spike'}
                </Button>
                <Button
                  variant="outlined"
                  style={{ borderColor: '#30363d', color: '#e6edf3', textTransform: 'none' }}
                  onClick={resetSimulation}
                  disabled={simulating}
                >
                  Reset Environment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rollback Audit Trail */}
        <Grid item xs={12}>
          <Typography variant="h6" style={{ marginBottom: '16px', fontWeight: 600 }}>
            Auto-Rollback Audit History (Immutable Git commits)
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeaderCell}>Timestamp</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Trigger Alert</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Target Service</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Feature Flag Reverted</TableCell>
                  <TableCell className={classes.tableHeaderCell}>GitOps Mutation Action</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rollbackHistory.map((event, idx) => (
                  <TableRow key={idx}>
                    <TableCell className={classes.tableCell} style={{ color: '#8b949e' }}>
                      {event.time}
                    </TableCell>
                    <TableCell className={classes.tableCell} style={{ color: '#ff7b72', fontWeight: 600 }}>
                      {event.alert}
                    </TableCell>
                    <TableCell className={classes.tableCell}>{event.service}</TableCell>
                    <TableCell className={classes.tableCell} style={{ fontFamily: 'monospace', color: '#58a6ff' }}>
                      {event.flag}
                    </TableCell>
                    <TableCell className={classes.tableCell} style={{ fontStyle: 'italic' }}>
                      {event.action}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <Chip
                        label={event.status}
                        className={classes.chipSuccess}
                        size="small"
                        icon={<CheckCircleIcon style={{ color: '#3fb950' }} />}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </div>
  );
}
