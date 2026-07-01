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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import AssessmentIcon from '@material-ui/icons/Assessment';
import TuneIcon from '@material-ui/icons/Tune';
import RouterIcon from '@material-ui/icons/Router';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

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
    background: 'linear-gradient(90deg, #58a6ff 0%, #3fb950 100%)',
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
      boxShadow: '0 8px 30px rgba(63, 185, 80, 0.15)',
      borderColor: '#3fb950',
    },
  },
  metricValue: {
    fontWeight: 700,
    fontSize: '2.5rem',
    margin: theme.spacing(1, 0),
    color: '#ffffff',
  },
  chipSuccess: {
    backgroundColor: 'rgba(46, 160, 67, 0.15)',
    color: '#3fb950',
    border: '1px solid rgba(46, 160, 67, 0.4)',
    fontWeight: 600,
  },
  chipWarning: {
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    color: '#d29922',
    border: '1px solid rgba(210, 153, 34, 0.4)',
    fontWeight: 600,
  },
  chipDanger: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    color: '#ff7b72',
    border: '1px solid rgba(248, 81, 73, 0.4)',
    fontWeight: 600,
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
  progressWarning: {
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #d29922 0%, #f0883e 100%)',
    },
  },
  progressDanger: {
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #ff7b72 0%, #f85149 100%)',
    },
  },
  actionBtn: {
    borderColor: '#30363d',
    color: '#58a6ff',
    textTransform: 'none',
    borderRadius: '8px',
    '&:hover': {
      borderColor: '#58a6ff',
      backgroundColor: 'rgba(88, 166, 255, 0.1)',
    },
  },
  dialogPaper: {
    backgroundColor: '#161b22',
    color: '#e6edf3',
    border: '1px solid #30363d',
    borderRadius: '12px',
  },
  inputField: {
    '& .MuiOutlinedInput-root': {
      color: '#e6edf3',
      '& fieldset': { borderColor: '#30363d' },
      '&:hover fieldset': { borderColor: '#8b949e' },
      '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
    },
    '& .MuiInputLabel-root': { color: '#8b949e' },
  },
  routingBox: {
    padding: theme.spacing(2),
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '8px',
    marginBottom: theme.spacing(2),
  },
}));

interface Quota {
  id: string;
  name: string;
  type: 'Developer' | 'AI Agent';
  model: string;
  budgetUsed: number;
  budgetMax: number;
  status: 'Under Limit' | 'Approaching Limit' | 'Suspended';
}

interface ModelMetrics {
  name: string;
  provider: string;
  tokensUsed: string;
  cost: number;
  latency: string;
}

export function LlmGovernanceDashboard() {
  const classes = useStyles();
  const [quotas, setQuotas] = useState<Quota[]>([
    {
      id: '1',
      name: 'literature-synthesis-agent',
      type: 'AI Agent',
      model: 'Claude 3.5 Sonnet',
      budgetUsed: 18.42,
      budgetMax: 50.00,
      status: 'Under Limit',
    },
    {
      id: '2',
      name: 'veyor-quoting-agent',
      type: 'AI Agent',
      model: 'GPT-4o',
      budgetUsed: 84.15,
      budgetMax: 100.00,
      status: 'Approaching Limit',
    },
    {
      id: '3',
      name: 'Dev Team Alpha',
      type: 'Developer',
      model: 'Multi-Model (Shared)',
      budgetUsed: 124.50,
      budgetMax: 500.00,
      status: 'Under Limit',
    },
    {
      id: '4',
      name: 'Legacy Parser Agent',
      type: 'AI Agent',
      model: 'GPT-3.5-Turbo',
      budgetUsed: 25.00,
      budgetMax: 25.00,
      status: 'Suspended',
    },
  ]);

  const [models] = useState<ModelMetrics[]>([
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic (LiteLLM Router)', tokensUsed: '4.8M', cost: 18.42, latency: '280ms' },
    { name: 'GPT-4o', provider: 'OpenAI (LiteLLM Router)', tokensUsed: '8.4M', cost: 84.15, latency: '190ms' },
    { name: 'Gemini 1.5 Pro', provider: 'Google (LiteLLM Router)', tokensUsed: '2.1M', cost: 14.70, latency: '320ms' },
    { name: 'Llama 3 70B (Local)', provider: 'vLLM', tokensUsed: '12.6M', cost: 0.00, latency: '90ms' },
  ]);

  const [activeRouting, setActiveRouting] = useState<'Anthropic' | 'OpenAI' | 'Google' | 'Fallback'>('Anthropic');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
  const [newMax, setNewMax] = useState('');

  const handleEditQuota = (quota: Quota) => {
    setSelectedQuota(quota);
    setNewMax(quota.budgetMax.toString());
    setDialogOpen(true);
  };

  const handleSaveQuota = () => {
    if (selectedQuota) {
      const updatedMax = parseFloat(newMax);
      if (!isNaN(updatedMax)) {
        setQuotas(prev =>
          prev.map(q =>
            q.id === selectedQuota.id
              ? {
                  ...q,
                  budgetMax: updatedMax,
                  status: q.budgetUsed >= updatedMax ? 'Suspended' : q.budgetUsed / updatedMax > 0.8 ? 'Approaching Limit' : 'Under Limit',
                }
              : q,
          ),
        );
      }
    }
    setDialogOpen(false);
  };

  return (
    <div className={classes.container}>
      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12} className={classes.titleSection}>
          <Typography className={classes.mainTitle} variant="h1">
            Enterprise LLM Model Control & Cost Governance
          </Typography>
          <Typography className={classes.subtitle} variant="body1">
            Manage rate-limiting, budget policies, routing rules, and real-time consumption for all AI models.
          </Typography>
        </Grid>

        {/* Metric Cards */}
        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">CUMULATIVE COST (MTD)</Typography>
                <AttachMoneyIcon style={{ color: '#3fb950' }} />
              </Box>
              <Typography className={classes.metricValue}>$227.07</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={45} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">TOTAL TOKENS</Typography>
                <AssessmentIcon style={{ color: '#58a6ff' }} />
              </Box>
              <Typography className={classes.metricValue}>27.9 M</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={70} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">ACTIVE QUOTAS</Typography>
                <AssignmentIndIcon style={{ color: '#bc8cff' }} />
              </Box>
              <Typography className={classes.metricValue}>4 / 50</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={8} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="textSecondary" variant="subtitle2">LITELLM CLUSTER LATENCY</Typography>
                <RouterIcon style={{ color: '#3fb950' }} />
              </Box>
              <Typography className={classes.metricValue}>192ms</Typography>
              <LinearProgress className={`${classes.progress} ${classes.progressSuccess}`} variant="determinate" value={90} />
            </CardContent>
          </Card>
        </Grid>

        {/* Quotas Table */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" style={{ marginBottom: '16px', fontWeight: 600 }}>
            Developer & Agent Quota Allocation
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeaderCell}>Name</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Type</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Default Model</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Consumption (USD)</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Budget Usage</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Quota Status</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotas.map(quota => {
                  const percentage = (quota.budgetUsed / quota.budgetMax) * 100;
                  return (
                    <TableRow key={quota.id}>
                      <TableCell className={classes.tableCell} style={{ fontWeight: 600 }}>{quota.name}</TableCell>
                      <TableCell className={classes.tableCell}>{quota.type}</TableCell>
                      <TableCell className={classes.tableCell} style={{ fontFamily: 'monospace', color: '#58a6ff' }}>{quota.model}</TableCell>
                      <TableCell className={classes.tableCell}>${quota.budgetUsed.toFixed(2)} / ${quota.budgetMax.toFixed(2)}</TableCell>
                      <TableCell className={classes.tableCell}>
                        <Box display="flex" alignItems="center" width="100px">
                          <LinearProgress
                            className={`${classes.progress} ${
                              quota.status === 'Suspended'
                                ? classes.progressDanger
                                : quota.status === 'Approaching Limit'
                                ? classes.progressWarning
                                : classes.progressSuccess
                            }`}
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Chip
                          label={quota.status}
                          size="small"
                          className={
                            quota.status === 'Under Limit'
                              ? classes.chipSuccess
                              : quota.status === 'Approaching Limit'
                              ? classes.chipWarning
                              : classes.chipDanger
                          }
                        />
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Button
                          variant="outlined"
                          size="small"
                          className={classes.actionBtn}
                          onClick={() => handleEditQuota(quota)}
                        >
                          Modify
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Dynamic Model Routing overrides */}
        <Grid item xs={12} md={4}>
          <Card className={classes.card} style={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" marginBottom="16px">
                <TuneIcon style={{ marginRight: '8px', color: '#58a6ff' }} />
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  LLM Gateway Smart Routing
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: '16px' }}>
                Dynamically switch providers or set automated fallback policies for all agents and dev endpoints through LiteLLM routing rules.
              </Typography>

              <Box className={classes.routingBox}>
                <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: '8px' }}>
                  Literature Synthesis Agent Routing Mode
                </Typography>
                <Box display="flex" flexDirection="column" style={{ gap: '8px' }}>
                  <Button
                    variant={activeRouting === 'Anthropic' ? 'contained' : 'outlined'}
                    style={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      backgroundColor: activeRouting === 'Anthropic' ? '#2ea043' : 'transparent',
                      color: activeRouting === 'Anthropic' ? '#ffffff' : '#e6edf3',
                      borderColor: '#30363d',
                    }}
                    onClick={() => setActiveRouting('Anthropic')}
                  >
                    Primary: Anthropic Claude 3.5 Sonnet
                  </Button>
                  <Button
                    variant={activeRouting === 'OpenAI' ? 'contained' : 'outlined'}
                    style={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      backgroundColor: activeRouting === 'OpenAI' ? '#2ea043' : 'transparent',
                      color: activeRouting === 'OpenAI' ? '#ffffff' : '#e6edf3',
                      borderColor: '#30363d',
                    }}
                    onClick={() => setActiveRouting('OpenAI')}
                  >
                    Alternate: OpenAI GPT-4o
                  </Button>
                  <Button
                    variant={activeRouting === 'Google' ? 'contained' : 'outlined'}
                    style={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      backgroundColor: activeRouting === 'Google' ? '#2ea043' : 'transparent',
                      color: activeRouting === 'Google' ? '#ffffff' : '#e6edf3',
                      borderColor: '#30363d',
                    }}
                    onClick={() => setActiveRouting('Google')}
                  >
                    Economic: Google Gemini 1.5 Pro
                  </Button>
                  <Button
                    variant={activeRouting === 'Fallback' ? 'contained' : 'outlined'}
                    style={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      backgroundColor: activeRouting === 'Fallback' ? '#8b949e' : 'transparent',
                      color: activeRouting === 'Fallback' ? '#ffffff' : '#e6edf3',
                      borderColor: '#30363d',
                    }}
                    onClick={() => setActiveRouting('Fallback')}
                  >
                    Automated Fallback (Sonnet → GPT-4o → Llama 3)
                  </Button>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" marginTop="16px">
                <CheckCircleIcon style={{ color: '#3fb950', marginRight: '8px', fontSize: '1.25rem' }} />
                <Typography variant="caption" style={{ color: '#8b949e' }}>
                  LiteLLM sync policy reconciled automatically with Kubernetes cluster ConfigMap.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Model Metrics Table */}
        <Grid item xs={12}>
          <Typography variant="h6" style={{ marginBottom: '16px', fontWeight: 600 }}>
            Model Routing & Latency Diagnostics (LiteLLM Proxy metrics)
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeaderCell}>Model Name</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Gateway Provider Target</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Tokens Dispatched</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Aggregated Cost (USD)</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Avg Latency</TableCell>
                  <TableCell className={classes.tableHeaderCell}>Provider Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map(model => (
                  <TableRow key={model.name}>
                    <TableCell className={classes.tableCell} style={{ fontWeight: 600 }}>{model.name}</TableCell>
                    <TableCell className={classes.tableCell}>{model.provider}</TableCell>
                    <TableCell className={classes.tableCell}>{model.tokensUsed}</TableCell>
                    <TableCell className={classes.tableCell}>${model.cost.toFixed(2)}</TableCell>
                    <TableCell className={classes.tableCell} style={{ fontFamily: 'monospace' }}>{model.latency}</TableCell>
                    <TableCell className={classes.tableCell}>
                      <Chip label="ONLINE" size="small" className={classes.chipSuccess} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Modify Quota Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        classes={{ paper: classes.dialogPaper }}
      >
        <DialogTitle style={{ fontWeight: 600, borderBottom: '1px solid #30363d' }}>
          Modify Allocation limit: {selectedQuota?.name}
        </DialogTitle>
        <DialogContent style={{ padding: '24px' }}>
          <Typography variant="body2" style={{ marginBottom: '20px', color: '#8b949e' }}>
            Adjust the daily/monthly consumption limit for this entity. Note: setting this below current consumption (${selectedQuota?.budgetUsed}) will immediately suspend API routing.
          </Typography>
          <TextField
            label="Maximum Monthly Quota ($ USD)"
            variant="outlined"
            fullWidth
            value={newMax}
            onChange={e => setNewMax(e.target.value)}
            className={classes.inputField}
          />
        </DialogContent>
        <DialogActions style={{ borderTop: '1px solid #30363d', padding: '16px' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            style={{ color: '#8b949e', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuota}
            variant="contained"
            style={{ backgroundColor: '#238636', color: '#ffffff', textTransform: 'none', fontWeight: 600 }}
          >
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
